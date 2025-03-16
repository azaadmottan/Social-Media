import mongoose, { Schema } from "mongoose";
import { IFollow } from "../interfaces/follow.interface.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const followSchema: Schema<IFollow> = new Schema({
  follower: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  following: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["Pending", "Accepted"],
    default: "Pending"
  },
}, { timestamps: true });

followSchema.plugin(mongooseAggregatePaginate);

export const FollowModel = mongoose.model<IFollow>("Follow", followSchema);