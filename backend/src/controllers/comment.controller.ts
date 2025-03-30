import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { IAuthenticatedRequest } from "../interfaces/user.interface.js";
import { Response } from "express";
import { createCommentSchema, editCommentSchema } from "../schemas/comment.schema.js";
import { PostModel } from "../models/post.model.js";
import { CommentModel } from "../models/comment.model.js";
import { isValidObjectId, Types } from "mongoose";

// Create comment
const createComment = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const validatedData = createCommentSchema.parse(req.body);
  const currentUser = req.user?._id;

  const post = await PostModel.findById({ _id: validatedData.post });

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  let comment = null;

  if (validatedData.parentComment) {
    comment = await CommentModel.findById({ _id: validatedData.parentComment });

    if (!comment) {
      throw new ApiError(404, "Parent comment not found");
    }

    const newComment = await CommentModel.create({
      post: validatedData.post,
      user: currentUser,
      content: validatedData.content,
      parentComment: validatedData.parentComment
    });

    // comment.replies.push(newComment?._id as Types.ObjectId);

    comment = await comment.save();
  } else {
    comment = await CommentModel.create({
      post: validatedData.post,
      user: currentUser,
      content: validatedData.content
    });
  }

  return res.status(201)
  .json(
    new ApiResponse(
      201,
      "Comment added successfully",
      comment
    )
  );
});

// Get all comments for a post
const getPostComments = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const postId = req.params?.id;

  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  const post = await PostModel.findOne({ _id: new Types.ObjectId(postId) });

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const comments = await CommentModel.aggregate([
    { $match: { post: new Types.ObjectId(postId), parentComment: null } },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $lookup: {
        from: "likes",
        let: { commentId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$comment", "$$commentId"] } } },
          { $count: "likeCount" },
        ],
        as: "likes",
      },
    },
    { $addFields: { likeCount: { $ifNull: [{ $arrayElemAt: ["$likes.likeCount", 0] }, 0] } } },
    {
      $graphLookup: {
        from: "comments",
        startWith: "$_id",
        connectFromField: "_id",
        connectToField: "parentComment",
        as: "replies",
        depthField: "depth",
      },
    },
    { 
      $project: {
        _id: 1,
        post: 1,
        user: {
          _id: "$user._id",
          userName: "$user.userName",
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          email: "$user.email",
          role: "$user.role",
          avatar: "$user.avatar",
          isPrivateAccount: "$user.isPrivateAccount",
        },
        parentComment: 1,
        content: 1,
        replies: 1,
        createdAt: 1,
        updatedAt: 1,
        likeCount: 1,
      } 
    },
    { $sort: { createdAt: -1 } },
  ]);

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Comments retrieved successfully",
      {
        commentCount: comments?.length,
        comments,
      }
    )
  );
});

// Get single comment
const getSingleComment = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const commentId = req.params?.id;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await CommentModel.findOne({ _id: new Types.ObjectId(commentId) });

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Comment retrieved successfully",
      comment
    )
  );
});

// Edit comment
const editComment = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const currentUser = req.user?._id;
  const validatedData = editCommentSchema.parse(req.body);

  const comment = await CommentModel.findOne({
    _id: validatedData.commentId,
    user: currentUser
  });

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  comment.content = validatedData.content;

  const updatedComment = await comment.save();

  if (!updatedComment) {
    throw new ApiError(500, "Failed to update comment");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Comment updated successfully",
      updatedComment
    )
  );
});

// Delete comment
const deleteComment = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const commentId = req.params?.id;
  const currentUser = req.user?._id;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await CommentModel.findOneAndDelete({
    _id: commentId,
    user: currentUser
  });

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Comment deleted successfully"
    )
  );
});


export {
  createComment,
  getPostComments,
  getSingleComment,
  editComment,
  deleteComment
}