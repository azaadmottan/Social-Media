import mongoose, { Schema } from "mongoose";
import { INotification } from "../interfaces/notification.interface.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const notificationSchema: Schema<INotification> = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  notificationType: {
    type: String,
    enum: ["Like", "Comment", "Follow", "Mention"],
    required: true
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: "Post",
    default: null
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: "Comment",
    default: null
  },
  like: {
    type: Schema.Types.ObjectId,
    ref: "Like",
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

notificationSchema.plugin(mongooseAggregatePaginate);

export const NotificationModel = mongoose.model<INotification>("Notification", notificationSchema);