import { Document, Types } from "mongoose";

export interface ILike extends Document {
  user: Types.ObjectId; // User who liked
  post: Types.ObjectId; // Can be a Post, Comment, or Reply
  comment: Types.ObjectId; // Can be a Post, Comment, or Reply
  targetType: "Post" | "Comment"; // Type of the liked content
  createdAt: Date;
  updatedAt: Date;
}