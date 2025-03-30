import mongoose, { Schema } from "mongoose";
import { IComment } from "../interfaces/comment.interface.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema: Schema<IComment> = new Schema({
  post: {
    type: Schema.Types.ObjectId,
    ref: "Post",
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  parentComment: {
    type: Schema.Types.ObjectId,
    ref: "Comment",
    default: null
  },
  content: {
    type: String,
    required: true,
  },
}, { timestamps: true });

commentSchema.plugin(mongooseAggregatePaginate);

export const CommentModel = mongoose.model<IComment>("Comment", commentSchema);