import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { IAuthenticatedRequest } from "../interfaces/user.interface.js";
import { Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import { PostModel } from "../models/post.model.js";
import { LikeModel } from "../models/like.model.js";
import { NotificationModel } from "../models/notification.model.js";
import { CommentModel } from "../models/comment.model.js";


// Toggle post like
const togglePostLike = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const postId = req?.params?.id;
  const currentUserId = req?.user?._id;

  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  const post = await PostModel.findById({ _id: postId });

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const isPostLikeExist = await LikeModel.findOne({
    user: currentUserId,
    post: postId
  });

  if (isPostLikeExist) {
    const removeLike = await LikeModel.findOneAndDelete({
      user: currentUserId,
      post: postId,
    });

    if (!removeLike) {
      throw new ApiError(500, "Failed to remove like");
    }

    return res.status(200)
    .json(
      new ApiResponse(
        200,
        "Like removed successfully",
        {
          post: removeLike,
        }
      )
    );
  }

  const newLike = await LikeModel.create({
    user: currentUserId,
    post: postId,
    targetType: "Post"
  });

  if (!newLike) {
    throw new ApiError(500, "Failed to like post");
  }

  const notification = await NotificationModel.create({
    user: post?.user,
    sender: currentUserId,
    notificationType: "Like",
    post: postId,
    message: `@${req?.user?.userName} liked your post`
  });

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Like added successfully",
      {
        post: newLike,
        notification
      }
    )
  );
});

// Get post likes
const getPostLikes = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const postId = req.params?.id;

  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  const post = await PostModel.findById({ _id: postId });

  if (!post) {
    throw new ApiError(404, "Post not found");
  }
  const likes = await LikeModel.aggregate([
    { 
      $match: { post: new Types.ObjectId(postId), targetType: "Post" } // Ensure correct filtering
    },
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
      $group: {
        _id: "$post",
        likeCount: { $sum: 1 },
        likedBy: {
          $push: {
            _id: "$user._id",
            userName: "$user.userName",
            firstName: "$user.firstName",
            lastName: "$user.lastName",
            email: "$user.email",
            avatar: "$user.avatar",
          },
        },
      },
    },
  ]);  

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Likes retrieved successfully",
      likes
    )
  )
});

// Toggle comment like
const toggleCommentLike = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const commentId = req?.params?.id;
  const currentUserId = req?.user?._id;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await CommentModel.findById({ _id: commentId });

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const isCommentLikeExist = await LikeModel.findOne({
    user: currentUserId,
    comment: commentId,
  });

  if (isCommentLikeExist) {
    const removeLike = await LikeModel.findOneAndDelete({
      user: currentUserId,
      comment: commentId,
    });

    if (!removeLike) {
      throw new ApiError(500, "Failed to remove like");
    }

    return res.status(200)
    .json(
      new ApiResponse(
        200,
        "Like removed successfully",
        {
          like: removeLike,
        }
      )
    );
  }

  const newLike = await LikeModel.create({
    user: currentUserId,
    comment: commentId,
    targetType: "Comment"
  });

  if (!newLike) {
    throw new ApiError(500, "Failed to like comment");
  }

  if (comment?.user?.toString() !== currentUserId?.toString()) {
    const notification = await NotificationModel.create({
      user: comment?.user,
      sender: currentUserId,
      notificationType: "Like",
      comment: commentId,
      message: `@${req?.user?.userName} liked your comment`
    });

    return res.status(200)
    .json(
      new ApiResponse(
        200,
        "Like added successfully",
        {
          like: newLike,
          notification
        }
      )
    );
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Like added successfully",
      {
        like: newLike
      }
    )
  );
});

export { 
  togglePostLike,
  getPostLikes,
  toggleCommentLike,
}