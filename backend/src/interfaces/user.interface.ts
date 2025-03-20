import { Request } from "express";
import { Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: string;
  userName: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  password: string;
  avatar: string | null;
  avatarPublicId: string | null;
  isPrivateAccount: boolean;
  bio?: string;
  location?: string;
  website?: string;
  role: "user" | "admin";
  accountActivationCode: string | null;
  activationCodeExpiry: Date | null;
  verifyCode: string | null;
  verifyCodeExpiry: Date | null;
  isVerified: boolean;
  isActive: boolean;
  isBanned: boolean;
  isProfileCompleted: boolean;
  refreshToken: string;
  comparePassword(enteredPassword: string): Promise<boolean>;
  generateAccessToken(): Promise<string>;
  generateRefreshToken(): Promise<string>;
  createdAt: Date;
  updatedAt: Date;
  isAccountDeleted: boolean;
  deletedAt?: Date | null;
  lastActivity?: Date | null;
}

export interface IAuthenticatedRequest extends Request {
  user?: any;
}