import { Document, Types } from "mongoose";

export interface IPost extends Document {
  user: Types.ObjectId;
  content: string | null;
  image: string;
  likes: Types.ObjectId[];
  comments: Types.ObjectId[];
  shares: Types.ObjectId[];
  views: number;
  mentions: Types.ObjectId[];
  visibility: "Public" | "Private" | "FriendsOnly";
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}