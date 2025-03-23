import { Document, Types } from "mongoose";

export interface IPost extends Document {
  user: Types.ObjectId;
  content: string | null;
  postImages: string[];
  postImagesPublicIds: string[];
  views: number;
  mentions: Types.ObjectId[];
  visibility: "Public" | "Private" | "FriendsOnly";
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}