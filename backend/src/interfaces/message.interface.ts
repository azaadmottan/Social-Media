import { Document, Types } from "mongoose";

export interface IMessage extends Document {
  chat: Types.ObjectId;
  user: Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}