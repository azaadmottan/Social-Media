import mongoose, { Schema } from "mongoose";
import { IRelation } from "../interfaces/relation.interface.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const relationSchema: Schema<IRelation> = new Schema({
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
    enum: ["Pending", "Accepted", "Blocked"],
    default: "Pending"
  },
}, { timestamps: true });

relationSchema.plugin(mongooseAggregatePaginate);

export const RelationModel = mongoose.model<IRelation>("Relation", relationSchema);