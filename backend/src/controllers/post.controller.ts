import { asyncHandler } from "../utils/asyncHandler.js";
import { IAuthenticatedRequest } from "../interfaces/user.interface.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { UserModel } from "../models/user.model.js";
import { PostModel } from "../models/post.model.js";
import { Response } from "express";
import { 
  createPostSchema, 
  editPostDetailSchema, 
  editPostImageSchema, 
  getAllPostSchema 
} from "../schemas/post.schema.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { isValidObjectId, Types } from "mongoose";
import { RelationModel } from "../models/relation.model.js";

// Create new post
const createPost = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const validatedData = createPostSchema.parse(req.body);

  let postImages: string[] = [];
  let postImagesPublicIds: string[] = [];

  if (validatedData?.mentions && validatedData?.mentions?.length > 0) {
    const mentionedUsers = await UserModel.find({
      _id: { 
        $in: validatedData.mentions 
      } 
    });

    if (mentionedUsers.length !== validatedData.mentions.length) {
      throw new ApiError(404, "One or more mentioned user account not found");
    }
  }

  if (Array.isArray(req.files) && req.files.length > 0) {
    const uploadPromises = (req.files as Express.Multer.File[]).map((file) => 
      uploadOnCloudinary(file?.path)
    );

    const uploadPosts = await Promise.all(uploadPromises);

    if (uploadPosts.some((post) => !post?.secure_url)) {
      throw new ApiError(500, "Some images failed to upload. Please try again.");
    }

    uploadPosts.forEach((post) => {
      if (post && post?.url) {
        postImages.push(post?.url);
        postImagesPublicIds.push(post?.public_id);
      }
    });
  }

  const newPost = await PostModel.create({
    user: req?.user?._id,
    content: validatedData.content,
    postImages,
    postImagesPublicIds,
    mentions: validatedData.mentions,
    visibility: validatedData?.visibility,
  });

  if (!newPost) {
    throw new ApiError(500, "Failed to create post");
  }

  return res.status(201)
  .json(
    new ApiResponse(
      201,
      "Post created successfully",
      {
        post: newPost,
      }
    )
  );
});

// Get posts
const getAllPosts = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const currentUserId = req?.user?._id;
  const validatedData = getAllPostSchema.parse(req.query);

  // For viewing a specific user's profile
  const userProfileId = validatedData.userProfileId;

  // Check if fetching global posts
  const isGlobalFeed = !userProfileId && true;
  
  const page = validatedData.page;
  const limit = validatedData.limit;
  const skip = (page - 1) * limit;

   // Get friend list
  const friendsOrFollowers = await RelationModel.find({
    $or: [
      { follower: currentUserId }, 
      { following: currentUserId }
    ],
    status: "Accepted"
  }).select("follower following");

  const friendIds = new Set(
    friendsOrFollowers.flatMap(({ follower, following }) => [
      String(follower),
      String(following)
    ])
  );

  // Get blocked users from FollowModel where status is "Blocked"
  const blockedUsers = await RelationModel.find({
    $or: [
      { follower: currentUserId, status: "Blocked" },
      { following: currentUserId, status: "Blocked" }
    ]
  }).select("follower following");

  const blockedUserIds = new Set(
    blockedUsers.flatMap(({ follower, following }) => [
      String(follower),
      String(following)
    ])
  );

  let queryConditions = {};

  if (isGlobalFeed) {
    // Fetching Global Posts (Explore)
    queryConditions = {
      user: { $nin: Array.from(blockedUserIds) },
      $or: [
        { visibility: "Public" },
        { $and: [{ visibility: "FriendsOnly" }, { user: { $in: Array.from(friendIds) } }] }
      ]
    };
  } else if (userProfileId) {
    if (String(userProfileId) === String(currentUserId)) {
      // Fetching Own Profile Posts
      queryConditions = { user: new Types.ObjectId(currentUserId) };
    } else {
      // Fetching Friend's Profile Posts
      queryConditions = {
        user: new Types.ObjectId(userProfileId),
        $or: [
          { visibility: "Public" },
          { $and: [{ visibility: "FriendsOnly" }, { user: { $in: Array.from(friendIds) } }] }
        ]
      };
    }
  }

  const posts = await PostModel.aggregate([
    { $match: { ...queryConditions, isDeleted: false } },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "author"
      }
    },
    { $unwind: "$author" },
    // Count total likes on the post
    {
      $lookup: {
        from: "likes",
        let: { postId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$post", "$$postId"] } } },
          { $count: "likeCount" }
        ],
        as: "likes",
      },
    },
    { $addFields: { likeCount: { $ifNull: [{ $arrayElemAt: ["$likes.likeCount", 0] }, 0] } } },
    { $project: { likes: 0 } }, // Remove the likes array
    // Count total comments on the post
    {
      $lookup: {
        from: "comments",
        let: { postId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$post", "$$postId"] } } },
          { $count: "commentCount" }
        ],
        as: "comments",
      },
    },
    { $addFields: { commentCount: { $ifNull: [{ $arrayElemAt: ["$comments.commentCount", 0] }, 0] } } },
    { $project: { comments: 0 } }, // Remove the comments array
    {
      $lookup: {
        from: "users",
        localField: "mentions",
        foreignField: "_id",
        as: "mentionDetails",
      },
    },
    { $unwind: "$mentionDetails", },
    {
      $project: {
        _id: 1,
        user: 1,
        content: 1,
        postImages: 1,
        postImagesPublicIds: 1,
        views: 1,
        mentions: {
          _id: "$mentionDetails._id",
          userName: "$mentionDetails.userName",
          firstName: "$mentionDetails.firstName",
          lastName: "$mentionDetails.lastName",
          email: "$mentionDetails.email",
          role: "$mentionDetails.role",
          avatar: "$mentionDetails.avatar",
          isPrivateAccount: "$mentionDetails.isPrivateAccount",
        },
        visibility: 1,
        likeCount: 1,
        commentCount: 1,
        createdAt: 1,
        updatedAt: 1,
        author: {
          _id: "$author._id",
          userName: "$author.userName",
          firstName: "$author.firstName",
          lastName: "$author.lastName",
          email: "$author.email",
          role: "$author.role",
          avatar: "$author.avatar",
          isPrivateAccount: "$author.isPrivateAccount",
        }
      }
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit }
  ]);

  // Count total posts
  const totalPosts = await PostModel.find({ ...queryConditions, isDeleted: false }).countDocuments();

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Posts retrieved successfully",
      {
        posts,
        totalPosts,
        currentPage: page,
        limit,
        totalPages: Math.ceil(totalPosts / limit),
      }
    )
  )
});

// Get post by id
const getSinglePost = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const postId = req?.params?.id;
  const currentUserId = req.user?._id;

  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  const postData = await PostModel.aggregate([
    { $match: { _id: new Types.ObjectId(postId), isDeleted: false } },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "author",
      },
    },
    { $unwind: "$author" },
    // Count total likes on the post
    {
      $lookup: {
        from: "likes",
        let: { postId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$post", "$$postId"] } } },
          { $count: "likeCount" }
        ],
        as: "likes",
      },
    },
    { $addFields: { likeCount: { $ifNull: [{ $arrayElemAt: ["$likes.likeCount", 0] }, 0] } } },
    { $project: { likes: 0 } }, // Remove the likes array
    // Count total comments on the post
    {
      $lookup: {
        from: "comments",
        let: { postId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$post", "$$postId"] } } },
          { $count: "commentCount" }
        ],
        as: "comments",
      },
    },
    { $addFields: { commentCount: { $ifNull: [{ $arrayElemAt: ["$comments.commentCount", 0] }, 0] } } },
    { $project: { comments: 0 } }, // Remove the comments array
    {
      $lookup: {
        from: "users",
        localField: "mentions",
        foreignField: "_id",
        as: "mentionDetails",
      },
    },
    { $unwind: "$mentionDetails", },
    {
      $project: {
        _id: 1,
        user: 1,
        content: 1,
        postImages: 1,
        postImagesPublicIds: 1,
        views: 1,
        mentions: {
          _id: "$mentionDetails._id",
          userName: "$mentionDetails.userName",
          firstName: "$mentionDetails.firstName",
          lastName: "$mentionDetails.lastName",
          email: "$mentionDetails.email",
          role: "$mentionDetails.role",
          avatar: "$mentionDetails.avatar",
          isPrivateAccount: "$mentionDetails.isPrivateAccount",
        },
        visibility: 1,
        likeCount: 1,
        commentCount: 1,
        createdAt: 1,
        updatedAt: 1,
        author: {
          _id: "$author._id",
          userName: "$author.userName",
          firstName: "$author.firstName",
          lastName: "$author.lastName",
          email: "$author.email",
          role: "$author.role",
          avatar: "$author.avatar",
          isPrivateAccount: "$author.isPrivateAccount",
        }
      }
    },
  ]);

  if (!postData.length) {
    throw new ApiError(404, "Post not found");
  }

  // Extract first post
  const post = postData[0];

  // Restrict access to private posts if the user is not the owner
  if (post?.visibility === "Private" && post?.user?.toString() !== String(currentUserId)) {
    throw new ApiError(403, "Access denied");
  }

  if (post?.user?.toString() !== String(currentUserId)) {
    // Check if the current user is a friend of the post author & use lean() to convert MONGO_DB object to plain JSON object
    const isCurrentUserFriend = await RelationModel.findOne({
      $or: [
        { follower: currentUserId, following: post?.user, status: "Accepted" },
        { follower: post?.user, following: currentUserId, status: "Accepted" }
      ]
    }).lean();

    // Restrict "FriendsOnly" posts to non-friends
    if (post?.visibility === "FriendsOnly" && !isCurrentUserFriend) {
      throw new ApiError(403, "Access denied, you cannot access this post");
    }
  }

  // Increment post views atomically & increment only if current user is not post author
  if (post?.user?.toString() !== String(currentUserId)) {
    await PostModel.updateOne(
      { _id: postId }, 
      { 
        $inc: { 
          views: 1,
        } 
      }
    );
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Post retrieved successfully",
      {
        post,
      }
    )
  );
});

// Edit post details
const editPostDetails = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const postId = req?.params?.id;

  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  const validatedData = editPostDetailSchema.parse(req.body);
  const currentUserId = req.user?._id;

  const post = await PostModel.findOne({ _id: postId, isDeleted: false });

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post?.user?.toString() !== String(currentUserId)) {
    throw new ApiError(403, "You are not authorized to edit this post");
  }

  if (validatedData?.mentions && validatedData?.mentions?.length > 0) {
    const mentionedUsers = await UserModel.find({
      _id: { 
        $in: validatedData.mentions 
      } 
    });

    if (mentionedUsers.length !== validatedData.mentions.length) {
      throw new ApiError(404, "One or more mentioned user account not found");
    }
  }

  post.content = validatedData.content || null;
  post.mentions = validatedData.mentions 
    ? validatedData.mentions.map((id: string) => new Types.ObjectId(id))
    : [];
  post.visibility = validatedData.visibility ? validatedData.visibility : post.visibility;

  const updatedPostDetails = await post.save();

  if (!updatedPostDetails) {
    throw new ApiError(500, "Failed to update post details");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Post details updated successfully",
      {
        post: updatedPostDetails,
      }
    )
  );
});

// Update post image
const editPostImages = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const postId = req?.params?.id;
  const currentUserId = req?.user?._id;
  
  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  const validatedData = editPostImageSchema.parse(req.body);

  const post = await PostModel.findOne({ _id: postId, isDeleted: false });

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post?.user?.toString() !== String(currentUserId)) {
    throw new ApiError(403, "You are not authorized to edit this post");
  }

  if (!validatedData?.removeImagePublicIds && !req?.files) {
    throw new ApiError(400, "No new image provided or public id for remove image");
  }

  if (
    post?.postImages?.length === 1 &&
    validatedData?.removeImagePublicIds?.some((publicId) => post.postImagesPublicIds.includes(publicId)) &&
    (!req?.files || req.files.length === 0) 
  ) {
    throw new ApiError(400, "Cannot remove the last image of a post");
  }

  const isNotImagePublicIdExist = validatedData.removeImagePublicIds?.filter(
    (publicId) => !post.postImagesPublicIds.includes(publicId)
  );
  
  if (isNotImagePublicIdExist && isNotImagePublicIdExist.length > 0) {
    throw new ApiError(404, "One or more mentioned image public IDs not found");
  }
  

  // Remove images from cloudinary
  if (validatedData?.removeImagePublicIds && validatedData?.removeImagePublicIds?.length > 0) {
    for (const publicId of validatedData?.removeImagePublicIds) {
      await deleteOnCloudinary(publicId);
    }

    // Remove from `postImages` and `postImagesPublicIds`
    post.postImages = post.postImages.filter(
      (_, index) => !validatedData.removeImagePublicIds?.includes(post.postImagesPublicIds[index])
    );

    post.postImagesPublicIds = post.postImagesPublicIds.filter(
      (publicId) => !validatedData.removeImagePublicIds?.includes(publicId)
    );
  }

  let newPostImages: string[] = [];
  let newPostImagesPublicIds: string[] = [];

  if (Array.isArray(req.files) && req.files.length > 0) {
    const uploadPromises = (req.files as Express.Multer.File[]).map((file) => 
      uploadOnCloudinary(file?.path)
    );

    const uploadPosts = await Promise.all(uploadPromises);

    if (uploadPosts.some((post) => !post?.secure_url)) {
      throw new ApiError(500, "Some images failed to upload. Please try again.");
    }

    uploadPosts.forEach((post) => {
      if (post && post?.url) {
        newPostImages.push(post?.url);
        newPostImagesPublicIds.push(post?.public_id);
      }
    });
  }

  post.postImages.push(...newPostImages);
  post.postImagesPublicIds.push(...newPostImagesPublicIds);

  const updatedPost = await post.save();

  if (!updatedPost) {
    throw new ApiError(500, "Failed to update post images");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Post images updated successfully",
      {
        post: updatedPost,
      }
    )
  );
});

// Delete post
const deletePost = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const postId = req?.params?.id;
  const currentUserId = req?.user?._id;

  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  const post = await PostModel.findOne({ _id: postId, isDeleted: false });

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post?.user?.toString()!== String(currentUserId)) {
    throw new ApiError(403, "You are not authorized to delete this post");
  }

  post.isDeleted = true;

  const deletedPost = await post.save();

  if (!deletedPost) {
    throw new ApiError(500, "Failed to delete post");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Post deleted successfully",
      {
        post: deletedPost,
      }
    )
  );
});

// Restore post
const restorePost = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const postId = req?.params?.id;
  const currentUserId = req?.user?._id;

  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  const post = await PostModel.findOne({ _id: postId, isDeleted: true });

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post?.user?.toString() !== String(currentUserId)) {
    throw new ApiError(403, "You are not authorized to restore this post");
  }

  post.isDeleted = false;

  const restoredPost = await post.save();

  if (!restoredPost) {
    throw new ApiError(500, "Failed to restore post");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Post restored successfully",
      {
        post: restoredPost,
      }
    )
  );
});


export {
  createPost,
  getAllPosts,
  getSinglePost,
  editPostDetails,
  editPostImages,
  deletePost,
  restorePost,
}