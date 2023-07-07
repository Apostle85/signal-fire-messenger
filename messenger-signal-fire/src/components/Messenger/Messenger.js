import { io } from 'socket.io-client';
import { useState, useEffect, useRef, useContext } from 'react';
import './Messenger.css';
import { format } from 'timeago.js';

import {
  CurrentUserContext,
  DialogContext,
  SavedMoviesContext,
} from '../../utils/contexts';
import DialogElement from '../DialogElement/DialogElement';
import Message from '../Message/Message';
import ChatOnline from '../ChatOnline/ChatOnline';
import MainApi from '../../utils/api/MainApi';
import { searchFriends } from '../../utils/utils';

const Messenger = () => {
  const { currentUser } = useContext(CurrentUserContext);
  const { savedMovies } = useContext(SavedMoviesContext);
  const { conversations, setConversations } = useContext(DialogContext);
  const [friendsList, setFriendsList] = useState([]);
  const [input, setInput] = useState('');
  // const [image, setImage] = useState();
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socket = useRef();
  // const inputImage = useRef();
  // const { user } = useContext(AuthContext);
  const scrollRef = useRef();
  useEffect(() => {
    socket.current = io('ws://localhost:8900');
    // socket.current.on('KEY_EXCHANGE', (data) => {
    //   if (!MainApi._X3DH._sharedKey) {
    //     const keyBundle = JSON.parse(data.text);
    //     console.log('INITIATOR_KEY', keyBundle);
    //     MainApi._X3DH
    //       .setInitiatorPeerBundle({
    //         IPKDerivingPublicKey: keyBundle.IPK.deriving,
    //         EKPublicKey: keyBundle.EK,
    //       })
    //       .then(() => MainApi._X3DH.computeRecieverSharedKey(data.senderId))
    //       .then(() => {
    //         console.log('KEY_EXCHANGE_RESULT: ', MainApi._X3DH._sharedKey);
    //         sendMessage(data.senderId, 'X3DH_PROTOCOL: KEY_EXCHANGE_SUCCEEDED');
    //       });
    //   }
    // });
    socket.current.on('getMessage', async (data) => {
      console.log('SOCKET:ON:GET_MESSAGE:', data);
      const payload = JSON.parse(JSON.parse(data.text).DRXPacket);
      console.log(payload);
      const message = await MainApi._doubleRatchet.recieve(payload);
      setArrivalMessage({
        senderId: data.senderId,
        text: message,
        createdAt: data.createdAt,
      });
    });
  }, []);

  useEffect(() => {
    console.log('VIEW:ADDING_MESSAGE');
    arrivalMessage &&
      currentChat?.members.includes(arrivalMessage.senderId) &&
      setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage, currentChat]);

  useEffect(() => {
    if (currentUser._id !== '') {
      console.log('ADD_USER');
      socket.current.emit('addUser', currentUser._id);
      socket.current.on('getUsers', (users) => {
        setOnlineUsers(
          currentUser.followings.filter((f) =>
            users.some((u) => u.userId === f)
          )
        );
      });
    }
  }, [currentUser]);

  useEffect(() => {
    MainApi.getDialogs()
      .then(({ data }) => {
        console.log('GOT_DIALOGS: ', data);
        setConversations(data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [setConversations]);

  useEffect(() => {
    setFriendsList(savedMovies);
  }, [savedMovies]);

  useEffect(() => {
    // X3DH Keys for CLIENT-CLIENT Encryption
    if (currentChat?.members) {
      console.log('CHAT_HAS_CHANGED:', currentChat?.members);
      const receiverId = currentChat.members.find(
        (member) => member !== currentUser._id
      );
      console.log(receiverId);
      console.log(currentChat?._id);
      MainApi.getDialogMessages(currentChat?._id)
        .then(async ({ data }) => {
          console.log(data);
          if (data.length === 0) return;
          if (!(await MainApi._X3DH.getSavedSharedKey(receiverId))) {
            console.log('RECEIVER');
            await MainApi._X3DH.continueDialog(
              receiverId,
              JSON.parse(data[0].text).initiatorBundle
            );
            await MainApi._doubleRatchet.init(receiverId, {
              initialRootKey: await MainApi._X3DH.getSavedSharedKey(receiverId),
              DHParams: MainApi._X3DH.userBundle.SPK,
              isInitiator: data[0].senderId === currentUser._id,
            });
          } else {
            console.log('else');
            await MainApi._doubleRatchet.init(receiverId, {});
          }
          const recievingKeys = [
            ...MainApi._doubleRatchet._recievingRatchet.keys,
          ];
          const sendingKeys = [...MainApi._doubleRatchet._sendingRatchet.keys];
          const keysLength = recievingKeys.length + sendingKeys.length;
          console.log('data:', data);
          console.log('data length:', data.length);
          console.log('Recieving keys length:', recievingKeys.length);
          console.log('Recieving keys:', recievingKeys);
          console.log('Sending keys length:', sendingKeys.length);
          console.log('Sending keys:', sendingKeys);
          let decryptedMessages = await data.reduce(
            async (prev, mes, index) => {
              const results = await prev;
              console.log('index:', index);
              if (index >= keysLength) {
                const payload = JSON.parse(JSON.parse(mes.text).DRXPacket);
                console.log(payload);
                console.log('TURNING_RATCHET');
                mes.text = await MainApi._doubleRatchet.recieve(payload);
              } else if (mes.senderId !== currentUser._id) {
                await MainApi._doubleRatchet._recievingRatchet._AES.setKey(
                  new Uint8Array(recievingKeys.shift())
                );
                console.log(JSON.parse(JSON.parse(mes.text).DRXPacket).payload);
                const { message, AD } =
                  await MainApi._doubleRatchet._recievingRatchet._AES.decryptAESGCM256(
                    JSON.parse(JSON.parse(mes.text).DRXPacket).payload
                  );
                mes.text = message;
                if (MainApi._doubleRatchet.AD !== AD)
                  console.log('ERROR:AD_NOT_EQUAL:DIALOG_HAS_BEEN_COMPROMISED');
              } else {
                await MainApi._doubleRatchet._sendingRatchet._AES.setKey(
                  new Uint8Array(sendingKeys.shift())
                );
                console.log(JSON.parse(JSON.parse(mes.text).DRXPacket).payload);
                const { message, AD } =
                  await MainApi._doubleRatchet._sendingRatchet._AES.decryptAESGCM256(
                    JSON.parse(JSON.parse(mes.text).DRXPacket).payload
                  );
                mes.text = message;
                if (MainApi._doubleRatchet.AD !== AD)
                  console.log('ERROR:AD_NOT_EQUAL:DIALOG_HAS_BEEN_COMPROMISED');
              }
              return [...results, mes];
            },
            []
          );
          // let decryptedMessages = await Promise.all(
          //   data.map(async (mes, index) => {
          //     console.log('index:', index);
          //     if (index >= recievingKeys.length + sendingKeys.length) {
          //       const payload = JSON.parse(JSON.parse(mes.text).DRXPacket);
          //       console.log(payload);
          //       console.log('TURNING_RATCHET');
          //       mes.text = await MainApi._doubleRatchet.recieve(payload);
          //     } else if (mes.senderId !== currentUser._id) {
          //       await MainApi._doubleRatchet._recievingRatchet._AES.setKey(
          //         new Uint8Array(recievingKeys[index])
          //       );
          //       const { message, AD } =
          //         await MainApi._doubleRatchet._recievingRatchet._AES.decryptAESGCM256(
          //           JSON.parse(JSON.parse(mes.text).DRXPacket).payload
          //         );
          //       mes.text = message;
          //       if (MainApi._doubleRatchet.AD !== AD)
          //         console.log('ERROR:AD_NOT_EQUAL:DIALOG_HAS_BEEN_COMPROMISED');
          //     } else {
          //       await MainApi._doubleRatchet._sendingRatchet._AES.setKey(
          //         new Uint8Array(sendingKeys[index])
          //       );
          //       const { message, AD } =
          //         await MainApi._doubleRatchet._sendingRatchet._AES.decryptAESGCM256(
          //           JSON.parse(JSON.parse(mes.text).DRXPacket).payload
          //         );
          //       mes.text = message;
          //       if (MainApi._doubleRatchet.AD !== AD)
          //         console.log('ERROR:AD_NOT_EQUAL:DIALOG_HAS_BEEN_COMPROMISED');
          //     }
          //     return mes;
          //   })
          // );
          console.log(decryptedMessages);
          setMessages(decryptedMessages);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [currentUser._id, currentChat?._id, currentChat?.members]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('MESSAGE_SUBMIT: CURRENT_CHAT:', currentChat);
    const receiverId = currentChat.members.find(
      (member) => member !== currentUser._id
    );
    if (messages.length === 0) {
      const initiatorBundle = await MainApi._X3DH.startDialog(
        receiverId
      );
      const sharedKey = await MainApi._X3DH.getSavedSharedKey(receiverId);
      const peerKey = MainApi._X3DH.peerBundle.SPK;
      console.log('INITING INITIATOR');
      await MainApi._doubleRatchet.init(receiverId, {
        initialRootKey: sharedKey,
        DHParams: peerKey,
        isInitiator: true,
      });
      const DRXPacket = JSON.stringify(
        await MainApi._doubleRatchet.send(newMessage)
      );
      console.log(DRXPacket);
      sendMessage(receiverId, { DRXPacket, initiatorBundle });
    } else {
      const DRXPacket = JSON.stringify(
        await MainApi._doubleRatchet.send(newMessage)
      );
      sendMessage(receiverId, { DRXPacket });
    }
    // const formData = new FormData();
    // formData.append('message', JSON.stringify(message));
    // formData.append('image', inputImage.current.files[0]);
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSearchInputChange = (input) => {
    const filteredFriends = searchFriends(savedMovies, input);
    setFriendsList(filteredFriends);
  };

  const sendMessage = (receiverId, message) => {
    message = JSON.stringify(message);
    const packedMessage = {
      senderId: currentUser._id,
      text: message,
      dialogId: currentChat._id,
      createdAt: Date.now(),
    };
    socket.current.emit('sendMessage', {
      senderId: currentUser._id,
      receiverId,
      text: message,
    });
    MainApi.createMessage(packedMessage)
      .then(async ({ data }) => {
        const keys = MainApi._doubleRatchet._sendingRatchet.keys;
        await MainApi._doubleRatchet._sendingRatchet._AES.setKey(
          new Uint8Array(keys[keys.length - 1])
        );
        console.log(JSON.parse(JSON.parse(data.text).DRXPacket).payload);
        const { message, AD } =
          await MainApi._doubleRatchet._sendingRatchet._AES.decryptAESGCM256(
            JSON.parse(JSON.parse(data.text).DRXPacket).payload
          );
        if (MainApi._doubleRatchet.AD !== AD)
          console.log('ERROR:AD_NOT_EQUAL:DIALOG_HAS_BEEN_COMPROMISED');
        data.text = message;
        setMessages([...messages, data]);
        setNewMessage('');
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <>
      <div className='messenger'>
        <div className='chatMenu'>
          <div className='chatMenuWrapper'>
            <input
              onChange={(e) => {
                setInput(e.target.value);
                handleSearchInputChange(e.target.value);
              }}
              value={input}
              placeholder='Search for friends'
              className='chatMenuInput'
            />
            {/* <button onClick={handleSearchButtonClick} type="submit">
              Найти
            </button> */}
            {friendsList.map((fr, index) => {
              const conv = conversations.find((c) =>
                c.members.includes(fr._id)
              );
              return (
                <div key={index} onClick={() => setCurrentChat(conv)}>
                  <DialogElement friend={fr} />
                </div>
              );
            })}
          </div>
        </div>
        <div className='chatBox'>
          <div className='chatBoxWrapper'>
            {currentChat ? (
              <>
                <div className='chatBoxTop'>
                  {messages.map((m, index) => {
                    return (
                      <div
                        className={`chatBox__element${
                          m.senderId === currentUser._id ? ' own' : ''
                        }`}
                        key={index}
                        ref={scrollRef}
                      >
                        <Message
                          message={m}
                          image={
                            m.senderId === currentUser._id
                              ? currentUser.image
                              : friendsList.filter(
                                  (fr) => fr._id === m.senderId
                                ).image
                          }
                          own={m.senderId === currentUser._id}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className='chatBoxBottom'>
                  <textarea
                    className='chatMessageInput'
                    placeholder='write something...'
                    onChange={(e) => setNewMessage(e.target.value)}
                    value={newMessage}
                  ></textarea>
                  <form
                    name='message'
                    className='chatButtons'
                    onSubmit={handleSubmit}
                  >
                    <label className='chatAddFileButtonAdapter'>
                      <input
                        type='file'
                        // ref={inputImage}
                        accept='image/png, image/jpg, image/jpeg'
                        className='chatAddFileButton'
                      />
                    </label>
                    <button className='chatSubmitButton'>Send</button>
                  </form>
                </div>
              </>
            ) : (
              <span className='noConversationText'>
                Приходи на Костер. Посидим, поболтаем.
              </span>
            )}
          </div>
        </div>
        <div className='chatOnline'>
          <div className='chatOnlineWrapper'>
            {currentUser._id && (
              <ChatOnline
                conversations={conversations}
                onlineUsers={onlineUsers}
                currentId={currentUser._id}
                setCurrentChat={setCurrentChat}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Messenger;
