import { Request } from "express";
import { Document, Types } from "mongoose";

export interface IUser extends Document {
  userName: string;
  fullName: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  role: "user" | "admin";
  isVerified: boolean;
  isBanned?: boolean;
  refreshToken?: string;
  followers: Types.ObjectId[],
  following: Types.ObjectId[],
  posts: Types.ObjectId[],
  deletedAt?: Date | null,
  comparePassword(enteredPassword: string): Promise<boolean>;
  generateAccessToken(): Promise<string>;
  generateRefreshToken(): Promise<string>;
}

export interface IAuthenticatedRequest extends Request {
  user?: any;
}