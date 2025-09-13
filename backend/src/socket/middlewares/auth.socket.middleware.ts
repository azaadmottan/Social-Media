import { Socket } from "socket.io";
import { config } from "../../config/config.js";
import { UserModel } from "../../models/user.model.js";
import jwt from "jsonwebtoken";

const authenticateSocketUser = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) return next(new Error("Token not provided"));

    const decoded = jwt.verify(token, config.jwtAccessTokenSecret!) as { _id: string };

    const user = await UserModel.findById(decoded._id).select("-password -refreshToken");

    if (!user) return next(new Error("User not found"));

    socket.data.user = user;
    next();
  } catch (error: any) {
    next(new Error(error.message || "Socket authentication failed"));
  }
};

export { authenticateSocketUser };