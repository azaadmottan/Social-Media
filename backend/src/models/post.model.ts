import mongoose, { Schema } from "mongoose";
import { IPost } from "../interfaces/post.interface.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const postSchema: Schema<IPost> = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
  },
  image: {
    type: String,
    required: true
  },
  likes: [
    {
      type: Schema.Types.ObjectId,
      ref: "Like"
    }
  ],
  comments: [
    {
      type: Schema.Types.ObjectId,
      ref: "Comment"
    }
  ],
  shares: [
    {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  views: {
    type: Number,
    default: 0
  },
  mentions: [
    {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  visibility: {
    type: String,
    enum: ["Public", "Private", "FriendsOnly"],
    default: "Public"
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

postSchema.plugin(mongooseAggregatePaginate);

export const PostModel = mongoose.model<IPost>("Post", postSchema);