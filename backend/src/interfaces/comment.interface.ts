import { Document, Types } from "mongoose";

export interface IComment extends Document {
  post: Types.ObjectId; // The post this comment belongs to
  user: Types.ObjectId; // The user who wrote the comment
  parentComment?: Types.ObjectId | null; // If it's a reply, reference to the parent comment
  content: string; // The comment text
  likes: Types.ObjectId[]; // Array of users who liked the comment
  replies: Types.ObjectId[]; // Array of reply comments (nested comments)
  createdAt: Date;
  updatedAt: Date;
}