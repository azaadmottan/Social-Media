import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { 
  setBulkOnlineUsers, 
  setUserOffline, 
  setUserOnline 
} from "@/redux/features/status/userStatusSlice";

export const useSocketListeners = (socket: any) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!socket) return;

    // Listen for single user online
    socket.on("user:online", (userId: string) => {
      dispatch(setUserOnline(userId));
    });

    // Listen for user disconnect
    socket.on("user:offline", (userId: string) => {
      dispatch(setUserOffline(userId));
    });

    // Optional: bulk update if backend emits list
    socket.on("users:online:list", (userIds: string[]) => {
      dispatch(setBulkOnlineUsers(userIds));
    });

    return () => {
      socket.off("user:online");
      socket.off("user:offline");
      socket.off("users:online:list");
    };
  }, [socket]);
};