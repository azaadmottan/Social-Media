import { Server } from "socket.io";
import { authenticateSocketUser } from "./middlewares/auth.socket.middleware.js";
import { registerChatHandlers } from "./handlers/chat.handler.js";
import { getUserChatRoomIds } from "../controllers/chat.controller.js";

const initSocket = (io: Server) => {
  io.use(authenticateSocketUser);

  io.on("connection", async (socket) => {
    const user = socket.data?.user;

    if (!user || !user._id) {
      console.log("⚠️  Socket connected without user context. Disconnecting...");
      return socket.disconnect(true);
    }

    console.log(`🔗 User connected: ${user?._id}`);
    console.log(`🔗 Socket connected: ${socket.id}`);

    // Join & setup private room
    socket.join(user?._id?.toString());

    // Emit online event
    socket.broadcast.emit("user:online", user?._id);

    // io.emit("user:online", user?._id);

    // Auto-join user to rooms
    // const rooms = await getUserChatRoomIds(user?._id);
    // rooms?.forEach((roomId) => socket.join(roomId));


    registerChatHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
};

export default initSocket;