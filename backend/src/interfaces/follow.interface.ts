import { Document, Types } from "mongoose";

export interface IFollow extends Document {
  follower: Types.ObjectId; // User who follows
  following: Types.ObjectId; // User who is being followed
  status: "Pending" | "Accepted"; // For handling follow requests
  createdAt: Date;
  updatedAt: Date;
}