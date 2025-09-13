import { Server, Socket } from "socket.io";

const onlineUsers = new Map(); // key: userId, value: socket.id

const getGroupRoomId = (groupId: string) => `group-${groupId}`;

export const registerChatHandlers = (io: Server, socket: Socket) => {

  socket.on("joinRoom", (roomId: string) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on("sendMessage", ({ roomId, message }) => {
    io.to(roomId).emit("newMessage", {
      sender: socket.data.user,
      message,
    });
  });

  // Chatting
  socket.on("chat:join", ({ chatId }) => {
    socket.join(chatId);
  });
  
  socket.on("group:join", ({ groupId }) => {
    const roomId = getGroupRoomId(groupId);
    socket.join(roomId);
  });
  
  // Send individual message
  socket.on("chat:message", async ({ chatId, message }) => {
    // const newMessage = await MessageModel.create({
    //   chatId,
    //   sender: socket.user._id,
    //   content: message,
    // });
    const newMessage = {
      chatId,
      sender: socket.id,
      content: message
    }
  
    io.to(chatId).emit("chat:message", newMessage);
  });

  // Send group message
  socket.on("group:message", async ({ groupId, message }) => {
    const roomId = getGroupRoomId(groupId);
  
    // const newMessage = await GroupMessageModel.create({
    //   groupId,
    //   sender: socket.user._id,
    //   content: message,
    // });
    const newMessage = {
      groupId,
      sender: socket.id,
      content: message,
    }
  
    io.to(roomId).emit("group:message", newMessage);
  });
  
  socket.on("chat:leave", ({ chatId }) => {
    socket.leave(chatId);
  });
  
  socket.on("group:leave", ({ groupId }) => {
    const roomId = getGroupRoomId(groupId);
    socket.leave(roomId);
  });

  socket.on("chat:typing", ({ chatId }) => {
    socket.to(chatId).emit("chat:typing", {sender: socket.id});
  });
  
  socket.on("chat:stopTyping", ({ chatId }) => {
    socket.to(chatId).emit("chat:stopTyping", {sender: socket.id});
  });
  
};