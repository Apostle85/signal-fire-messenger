import { useEffect, useState } from "react";
import MainApi from "../../utils/api/MainApi";
import "./ChatOnline.css";

export default function ChatOnline({
  conversations,
  onlineUsers,
  currentId,
  setCurrentChat,
}) {
  const [friends, setFriends] = useState([]);
  const [onlineFriends, setOnlineFriends] = useState([]);

  useEffect(() => {
    const getFriends = async () => {
      const { data: res } = await MainApi.getFriends();
      setFriends(res);
    };
    getFriends();
  }, [currentId]);

  useEffect(() => {
    setOnlineFriends(friends.filter((f) => onlineUsers.includes(f._id)));
  }, [friends, onlineUsers]);

  const handleClick = (user) => {
    console.log(conversations);
    setCurrentChat(
      conversations.filter((c) => {
        return c.members.includes(currentId) && c.members.includes(user._id);
      })
    );
  };

  return (
    <div className="chatOnline">
      {onlineFriends.map((o) => (
        <div key={o._id} className="chatOnlineFriend" onClick={() => handleClick(o)}>
          <div className="chatOnlineImgContainer">
            <img
              className="chatOnlineImg"
              // src={
              //   o?.profilePicture
              //     ? PF + o.profilePicture
              //     : PF + "person/noAvatar.png"
              // }
              alt="АВАТАР"
            />
            <div className="chatOnlineBadge"></div>
          </div>
          <span className="chatOnlineName">{o?.username}</span>
        </div>
      ))}
    </div>
  );
}
