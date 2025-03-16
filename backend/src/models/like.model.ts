import mongoose, { Schema } from "mongoose";
import { ILike } from "../interfaces/like.interface.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema: Schema<ILike> = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: "Post"
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: "Comment"
  },
  targetType: {
    type: String,
    enum: ["Post", "Comment"],
    required: true
  }
}, { timestamps: true });

likeSchema.plugin(mongooseAggregatePaginate);

export const LikeModel = mongoose.model<ILike>("Like", likeSchema);