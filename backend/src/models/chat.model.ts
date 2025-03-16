import mongoose, { Schema } from "mongoose";
import { IChat } from "../interfaces/chat.interface.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const chatSchema: Schema<IChat> = new Schema({
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  isGroupChat: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    default: null
  },
  groupAvatar: {
    type: String,
    default: null
  },
  groupCreatedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  }
}, { timestamps: true });

chatSchema.plugin(mongooseAggregatePaginate);

export const ChatModel = mongoose.model<IChat>("Chat", chatSchema);