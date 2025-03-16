import { Document, Types } from "mongoose";

export interface IChat extends Document {
  members: Types.ObjectId[];
  isGroupChat: boolean;
  groupName?: string | null;
  groupAvatar?: string | null;
  groupCreatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}