import { API_ENDPOINT } from "@/constants/apiEndpoint";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initSocket = (token: string) => {
  if (!socket) {
    socket = io(API_ENDPOINT.MAIN_URL, {
      autoConnect: false,
      auth: {
        token,
      },
    });

    socket.connect();

    socket.on("connect", () => {
      console.log(`✅ Socket connected: ${socket?.id}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    console.warn("⚠️ Socket not initialized. Call initSocket(token) first.");
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};