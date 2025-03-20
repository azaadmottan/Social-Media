import { Document, Types } from "mongoose";

export interface INotification extends Document {
  user: Types.ObjectId;
  sender: Types.ObjectId;
  notificationType: "Like" | "Comment" | "Follow" | "Mention";
  post?: Types.ObjectId | null;
  comment?: Types.ObjectId | null;
  like?: Types.ObjectId | null;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}