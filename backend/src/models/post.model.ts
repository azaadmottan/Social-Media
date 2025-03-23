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
  postImages: [
    {
      type: String,
    }
  ],
  postImagesPublicIds: [
    {
      type: String,
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