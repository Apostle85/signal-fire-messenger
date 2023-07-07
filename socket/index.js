const io = require("socket.io")(8900, {
  cors: {
    origin: "http://localhost:3001",
  },
});

let users = [];

const addUser = (userId, socketId) => {
  console.log("USERS: ", users);
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  //take userId and socketId from user
  socket.on("addUser", (userId) => {
    console.log(`ADD_USER: {\nSTATUS: SUCCEEDED,\n{\nUSER_ID - ${userId},\nSOCKET_ID - ${socket.id}\n}\n}`);
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  socket.on("KEY_EXCHANGE", ({senderId, receiverId, text}) => {
    const user = getUser(receiverId);
    if (user !== undefined) {
      console.log(
        `KEY_EXCHANGE: {\nSTATUS: SUCCEEDED,\n{\nFROM - ${senderId},\nTO - ${receiverId},\nTEXT - ${text}\n}\n}`
      );
      io.to(user.socketId).emit("getMessage", {
        senderId,
        text,
      });
    } else {
      console.log(
        `KEY_EXCHANGE: {\nSTATUS: FAILED,\n{\nFROM - ${senderId},\nTO - ${receiverId},\nTEXT - ${text}\n}\n}`
      );
    }
  })
  //send and get message
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const user = getUser(receiverId);
    if (user !== undefined) {
      console.log(
        `SEND_MESSAGE: {\nSTATUS: SUCCEEDED,\n{\nFROM - ${senderId},\nTO - ${receiverId},\nTEXT - ${text}\n}\n}`
      );
      io.to(user.socketId).emit("getMessage", {
        senderId,
        text,
      });
    } else {
      console.log(
        `SEND_MESSAGE: {\nSTATUS: FAILED,\n{\nFROM - ${senderId},\nTO - ${receiverId},\nTEXT - ${text}\n}\n}`
      );
    }
  });

  //when disconnect
  socket.on("disconnect", () => {
    console.log("a user disconnected!");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});
