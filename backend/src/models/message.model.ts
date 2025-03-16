import mongoose, { Schema } from "mongoose";
import { IMessage } from "../interfaces/message.interface.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const messageSchema: Schema<IMessage> = new Schema({
  chat: {
    type: Schema.Types.ObjectId,
    ref: "Chat",
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String,
    required: true
  }
}, { timestamps: true });

messageSchema.plugin(mongooseAggregatePaginate);

export const MessageModel = mongoose.model<IMessage>("Message", messageSchema);