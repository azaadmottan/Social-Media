import { Response } from "express";
import { IAuthenticatedRequest } from "../interfaces/user.interface.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId, Types } from "mongoose";
import { ApiError } from "../utils/apiError.js";
import { RelationModel } from "../models/relation.model.js";
import { UserModel } from "../models/user.model.js";
import { NotificationModel } from "../models/notification.model.js";
import { ApiResponse } from "../utils/apiResponse.js";

// Sends a follow request to another user
const sendFollowRequest = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const { id } = req.body;
  const currentUserId = req.user?._id;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid follow request ID");
  }

  if (id === String(currentUserId)) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  // Check if the requested user exists
  const requestedUser = await UserModel.findById(id);
  if (!requestedUser || !requestedUser.isVerified || requestedUser.isBanned) {
    throw new ApiError(404, "Requested user not found");
  }

  // Check if the current user is already following the requested user
  const isExistFollowing = await RelationModel.findOne({
    follower: currentUserId,
    following: id,
  });

  if (isExistFollowing?.status === "Accepted") {
    throw new ApiError(400, `You have already follow this user`);
  }

  if (isExistFollowing?.status === "Pending") {
    throw new ApiError(400, "You have already sent a follow request to this user");
  }

  // Send follow-request to private account
  if (requestedUser.isPrivateAccount) {
    // Send request to private account
    const followRequest = await RelationModel.create({
      follower: currentUserId,
      following: id,
      status: "Pending",
    });

    if (!followRequest) {
      throw new ApiError(500, "Failed to send follow request");
    }

    // Create notification
    const notification = await NotificationModel.create({
      notificationType: "Follow",
      user: id,
      sender: currentUserId,
      message: `@${req.user?.userName} sent you a follow request.`
    });

    return res.status(201)
    .json(
      new ApiResponse(
        201,
        "Follow request sent successfully",
        {
          followRequest,
          notification
        }
      )
    );
  }

  // Send & accept follow-request to public account
  const followRequest = await RelationModel.create({
    follower: currentUserId,
    following: id,
    status: "Accepted",
  });

  if (!followRequest) {
    throw new ApiError(500, "Failed to send follow request");
  }

  // Create notification
  const notification = await NotificationModel.create({
    notificationType: "Follow",
    user: id,
    sender: currentUserId,
    message: `@${req.user?.userName} followed you.`
  });

  return res.status(201)
  .json(
    new ApiResponse(
      201,
      "User followed successfully",
      {
        followRequest,
        notification
      }
    )
  );
});

// Accepts a pending follow request
const acceptFollowRequest = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const { id } = req.body;
  const currentUserId = req.user?._id;

  if (!isValidObjectId(id) || id === String(currentUserId)) {
    throw new ApiError(400, "Invalid follow request ID");
  }

  const requestedUser = await UserModel.findById(id);

  if (!requestedUser || !requestedUser.isVerified || requestedUser.isBanned) {
    throw new ApiError(404, "User not found");
  }

  // Check if the follow request exists
  const followRequest = await RelationModel.findOne({
    follower: id,
    following: currentUserId,
    status: "Pending",
  });

  if (!followRequest || followRequest.status !== "Pending") {
    throw new ApiError(404, "Follow request not found or already accepted");
  }

  // Accept the follow request
  followRequest.status = "Accepted";
  const saveRequest = await followRequest.save();

  if (!saveRequest) {
    throw new ApiError(500, "Failed to accept follow request");
  }

  // Create notification
  const notification = await NotificationModel.create({
    notificationType: "Follow",
    user: id,
    sender: currentUserId,
    message: `@${req.user?.userName} accept your request.`
  });

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Follow request accepted successfully",
      {
        followRequest,
        notification
      }
    )
  );
});

// Cancel a sent follow request
const cancelFollowRequest = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const { id } = req.body;
  const currentUserId = req.user?._id;

  if (!isValidObjectId(id) || id === String(currentUserId)) {
    throw new ApiError(400, "Invalid follow request ID");
  }

  const requestedUser = await UserModel.findById(id);

  if (!requestedUser || !requestedUser.isVerified || requestedUser.isBanned) {
    throw new ApiError(404, "User not found");
  }

  // Find the follow request
  const followRequest = await RelationModel.findOne({
    follower: currentUserId,
    following: id,
    status: "Pending",
  });

  if (!followRequest) {
    throw new ApiError(404, "Follow request not found or already accepted");
  }


  // Remove the follow request
  const deleteRequest = await RelationModel.findByIdAndDelete(followRequest?._id);

  if (!deleteRequest) {
    throw new ApiError(500, "Failed to cancel follow request");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Follow request canceled successfully",
      { 
        deletedRequestId: followRequest?._id,
      }
    )
  );
});

// Rejects a received follow request
const rejectFollowRequest = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const { id } = req.body;
  const currentUserId = req.user?._id;

  if (!isValidObjectId(id) || id === String(currentUserId)) {
    throw new ApiError(400, "Invalid follow request ID");
  }

  const requestedUser = await UserModel.findById(id);

  if (!requestedUser || !requestedUser.isVerified || requestedUser.isBanned) {
    throw new ApiError(404, "User not found");
  }

  // Check if the follow request exists
  const followRequest = await RelationModel.findOne({
    follower: id,
    following: currentUserId,
    status: "Pending",
  });

  if (!followRequest) {
    throw new ApiError(404, "Follow request not found or you already accepted");
  }

  // Delete the follow request (rejecting it)
  const deletedRequest = await RelationModel.findByIdAndDelete(followRequest._id);

  if (!deletedRequest) {
    throw new ApiError(500, "Failed to reject follow request");
  }

  // Create notification
  const notification = await NotificationModel.create({
    notificationType: "Follow",
    user: id,
    sender: currentUserId,
    message: `@${req.user?.userName} rejected your request.`
  });

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Follow request rejected successfully",
      { 
        rejectedRequestId: followRequest._id,
        notification
      }
    )
  );
});

// Unfollows a user and removes from followers list
const unfollowUser = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const { id } = req.body;
  const currentUserId = req.user?._id;

  if (!isValidObjectId(id) || id === String(currentUserId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const requestedUser = await UserModel.findById(id);

  if (!requestedUser || !requestedUser.isVerified || requestedUser.isBanned) {
    throw new ApiError(404, "User not found");
  }

  // Check if the user is already following
  const followRequest = await RelationModel.findOne({
    follower: currentUserId,
    following: id,
    status: "Accepted",
  });

  if (!followRequest) {
    throw new ApiError(404, "You are not following this user");
  }

  const unfollow = await RelationModel.findByIdAndDelete(followRequest?._id);

  if (!unfollow) {
    throw new ApiError(500, "Failed to unfollow user");
  }

  // Create notification
  const notification = await NotificationModel.create({
    notificationType: "Follow",
    user: id,
    sender: currentUserId,
    message: `@${req.user?.userName} unfollowed you.`
  });

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "User unfollowed successfully",
      {
        unfollowedUserId: id,
        notification
      }
    )
  );
});

// Get social profile
const getUserSocialProfile = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const userProfile = await UserModel.aggregate([
    {
      $match: { _id: new Types.ObjectId(id) }
    },
    {
      $project: {
        password: 0,
        refreshToken: 0,
        verifyCode: 0,
        verifyCodeExpiry: 0,
        accountActivationCode: 0,
        activationCodeExpiry: 0,
        avatarPublicId: 0
      }
    },
    {
      $addFields: {
        fullName: {
          $trim: {
            input: {
              $concat: [
                { $ifNull: ["$firstName", ""] },
                " ",
                { $ifNull: ["$lastName", ""] }
              ]
            }
          }
        }
      }
    },
    {
      $lookup: {
        from: "follows",
        let: { userId: "$_id" },
        pipeline: [
          { 
            $match: { 
              $expr: { 
                $and: [
                  { $eq: ["$following", "$$userId"] }, 
                  { $eq: ["$status", "Accepted"] }
                ] 
              } 
            } 
          },
          { $count: "followersCount" }
        ],
        as: "followersData"
      }
    },
    {
      $lookup: {
        from: "follows",
        let: { userId: "$_id" },
        pipeline: [
          { 
            $match: { 
              $expr: { 
                $and: [
                  { $eq: ["$follower", "$$userId"] }, 
                  { $eq: ["$status", "Accepted"] }
                ] 
              } 
            } 
          },
          { $count: "followingCount" }
        ],
        as: "followingData"
      }
    },
    {
      $addFields: {
        followersCount: { $ifNull: [{ $arrayElemAt: ["$followersData.followersCount", 0] }, 0] },
        followingCount: { $ifNull: [{ $arrayElemAt: ["$followingData.followingCount", 0] }, 0] }
      }
    },
    {
      $project: {
        followersData: 0,
        followingData: 0
      }
    }
  ]);

  // If user is not found or banned
  if (!userProfile.length || !userProfile[0].isVerified || userProfile[0].isBanned) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200, 
      "User social profile retrieved successfully",
      userProfile[0]
    )
  );
});

// Retrieves the list of user that follow me
const getMyFollowerList = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?._id;

  const followers = await RelationModel.aggregate([
    {
      $match: {
        following: new Types.ObjectId(currentUserId), // Users following me
        status: "Accepted"
      }
    },
    {
      $lookup: {
        from: "users", // Reference to the "users" collection
        localField: "follower",
        foreignField: "_id",
        as: "followerInfo"
      }
    },
    {
      $unwind: "$followerInfo" // Convert array into object
    },
    {
      $project: {
        _id: "$followerInfo._id", // Restructure to be a flat object
        userName: "$followerInfo.userName",
        email: "$followerInfo.email",
        avatar: "$followerInfo.avatar",
        firstName: "$followerInfo.firstName",
        lastName: "$followerInfo.lastName",
        isPrivateAccount: "$followerInfo.isPrivateAccount"
      }
    }
  ]);

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Follower list retrieved successfully",
      followers
    )
  );
});

// Retrieves the list of followers for a user
const getUserFollowerList = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const currentUserId = req.user?._id;

  if (!isValidObjectId(id) || id === String(currentUserId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await UserModel.findById(id);

  if (!user || !user.isVerified || user.isBanned) {
    throw new ApiError(404, "User not found");
  }

  const isUserFriend = await RelationModel.findOne({
    $or: [
      {
        follower: new Types.ObjectId(currentUserId),
        following: new Types.ObjectId(id),
      },
      {
        follower: new Types.ObjectId(id),
        following: new Types.ObjectId(currentUserId),
      }
    ],
    status: "Accepted",
  });

  if (user?.isPrivateAccount && !isUserFriend) {
    throw new ApiError(403, "You cannot access private account followers");
  }

  const followers = await RelationModel.aggregate([
    {
      $match: {
        following: new Types.ObjectId(id),
        status: "Accepted",
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "follower",
        foreignField: "_id",
        as: "follower",
        pipeline: [
          {
            $lookup: {
              from: "relations",
              let: { followerId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$following", new Types.ObjectId(id)] },
                        { $eq: ["$status", "Accepted"] }
                      ]
                    }
                  }
                }
              ],
              as: "mutualFollow"
            }
          },
          {
            $addFields: {
              isMutual: { $gt: [{ $size: "$mutualFollow" }, 0] },
              followersCount: { $size: "$mutualFollow" },
              fullName: {
                $trim: {
                  input: {
                    $concat: [
                      { $ifNull: ["$firstName", ""] },
                      " ",
                      { $ifNull: ["$lastName", ""] }
                    ]
                  }
                }
              }
            }
          }
        ]
      }
    },
    { $unwind: "$follower" },
    {
      $project: {
        _id: "$follower._id",
        userName: "$follower.userName",
        firstName: "$follower.firstName",
        lastName: "$follower.lastName",
        fullName: "$follower.fullName",
        avatar: "$follower.avatar",
        isMutual: "$follower.isMutual",
      }
    }
  ]);

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Followers list retrieved successfully",
      {
        followers,
        followerCount: followers.length
      }
    )
  );
}); 

// Retrieves the list of users the current user is following
const getUserFollowingList = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const currentUserId = req.user?._id;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await UserModel.findById(id);

  if (!user || !user.isVerified || user.isBanned) {
    throw new ApiError(404, "User not found");
  }

  const isUserFriend = await RelationModel.findOne({
    $or: [
      {
        follower: currentUserId,
        following: id,
      },
      {
        follower: id,
        following: currentUserId,
      }
    ],
    status: "Accepted",
  });

  if (user?.isPrivateAccount && !isUserFriend) {
    throw new ApiError(403, "You cannot access private account following");
  }

  const followings = await RelationModel.aggregate([
    {
      $match: {
        follower: new Types.ObjectId(id),
        status: "Accepted"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "following",
        foreignField: "_id",
        as: "following",
        pipeline: [
          {
            $lookup: {
              from: "follows",
              let: { followingId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$follower", new Types.ObjectId(id)] },
                        { $eq: ["$status", "Accepted"] }
                      ]
                    }
                  }
                }
              ],
              as: "mutualFollow"
            }
          },
          {
            $addFields: {
              isMutual: { $gt: [{ $size: "$mutualFollow" }, 0] },
              followingCount: { $size: "$mutualFollow" },
              fullName: {
                $trim: {
                  input: {
                    $concat: [
                      { $ifNull: ["$firstName", ""] },
                      " ",
                      { $ifNull: ["$lastName", ""] }
                    ]
                  }
                }
              }
            }
          }
        ]
      }
    },
    { $unwind: "$following" },
    {
      $project: {
        _id: "$following._id",
        userName: "$following.userName",
        firstName: "$following.firstName",
        lastName: "$following.lastName",
        fullName: "$following.fullName",
        avatar: "$following.avatar",
        isMutual: "$following.isMutual",
      }
    }
  ]);

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Following list retrieved successfully",
      {
        followings,
        followingCount: followings.length
      }
    )
  );
}); 

// Fetches pending follow requests (received)
const getFollowerRequests = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?._id;

  if (!isValidObjectId(currentUserId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const followRequests = await RelationModel.aggregate([
    {
      $match: {
        following: new Types.ObjectId(currentUserId),
        status: "Pending"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "follower",
        foreignField: "_id",
        as: "follower"
      }
    },
    {
      $unwind: "$follower" // Convert array into an object
    },
    {
      $project: {
        _id: 1,
        follower: {
          password: 0,
          refreshToken: 0,
          verifyCode: 0,
          verifyCodeExpiry: 0,
          accountActivationCode: 0,
          activationCodeExpiry: 0,
          avatarPublicId: 0
        }
      }
    }
  ]);

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Follower request retrieved successfully",
      followRequests
    )
  );
}); 

// Fetches sent follow requests
const getFollowingRequests = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?._id;

  const sentFollowRequests = await RelationModel.aggregate([
    {
      $match: {
        follower: new Types.ObjectId(currentUserId),
        status: "Pending"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "following",
        foreignField: "_id",
        as: "following"
      }
    },
    {
      $unwind: "$following" // Convert array into an object
    },
    {
      $project: {
        _id: 1,
        following: {
          password: 0,
          refreshToken: 0,
          verifyCode: 0,
          verifyCodeExpiry: 0,
          accountActivationCode: 0,
          activationCodeExpiry: 0,
          avatarPublicId: 0
        }
      }
    }
  ]);

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Following request retrieved successfully",
      sentFollowRequests
    )
  );
}); 

// Removes a user from followers list
const removeFollower = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const { id } = req.body;
  const currentUserId = req.user?._id;

  if (!isValidObjectId(id) || id === String(currentUserId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const follower = await RelationModel.findOneAndDelete(
    {
      follower: new Types.ObjectId(id),
      following: new Types.ObjectId(currentUserId),
      status: "Accepted"
    },
  );

  if (!follower) {
    throw new ApiError(404, "Follow request not found");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Follower removed successfully",
      follower
    )
  );
});

// Blocks a user and removes them from followers/following
const blockUser = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const { id } = req.body;
  const currentUserId = req.user?._id;

  if (!isValidObjectId(id) || id === String(currentUserId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const existingFollow = await RelationModel.findOne({
    $or: [
      { 
        follower: new Types.ObjectId(id), 
        following: new Types.ObjectId(currentUserId) 
      },
      { 
        follower: new Types.ObjectId(currentUserId), 
        following: new Types.ObjectId(id) 
      }
    ],
  });

  let blockedUser;
  
  // If they already have a follow relationship, update it to "Blocked"
  if (existingFollow) {
    existingFollow.status = "Blocked";
    blockedUser = await existingFollow.save();
  } else {
    // If no previous connection, create a new "Blocked" entry
    blockedUser = await RelationModel.create({
      follower: new Types.ObjectId(id),
      following: new Types.ObjectId(currentUserId),
      status: "Blocked"
    });
  }
  
  return res.status(200)
  .json(
    new ApiResponse(
      200, 
      "User blocked successfully", 
      blockedUser
    )
  );  
});

// Unblocks a previously blocked user
const unblockUser = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const { id } = req.body;
  const currentUserId = req.user?._id;

  if (!isValidObjectId(id) || id === String(currentUserId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const unblockedUser = await RelationModel.findOneAndDelete(
    {
      $or: [
        { 
          follower: new Types.ObjectId(id), 
          following: new Types.ObjectId(currentUserId) 
        },
        { 
          follower: new Types.ObjectId(currentUserId), 
          following: new Types.ObjectId(id) 
        }
      ],
      status: "Blocked"
    },
  );

  if (!unblockedUser) {
    throw new ApiError(404, "No blocked follow relationship found");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "User unblocked successfully",
      unblockedUser
    )
  );
});

// Get blocked users
const getBlockedUsers = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?._id;

  if (!isValidObjectId(currentUserId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const blockedUsers = await RelationModel.aggregate([
    {
      $match: {
        $or: [
          { follower: new Types.ObjectId(currentUserId) },
          { following: new Types.ObjectId(currentUserId) }
        ],
        status: "Blocked"
      }
    },
    {
      $lookup: {
        from: "users",
        let: { 
          userId: { 
            $cond: { 
              if: { 
                $eq: ["$follower", new Types.ObjectId(currentUserId)] 
              }, 
              then: "$following", else: "$follower" } } 
            },
        pipeline: [
          { 
            $match: { 
              $expr: { $eq: ["$_id", "$$userId"] } 
            } 
          },
          { 
            $project: { 
              password: 0, refreshToken: 0, verifyCode: 0, verifyCodeExpiry: 0, 
              accountActivationCode: 0, activationCodeExpiry: 0, avatarPublicId: 0, 
              isProfileCompleted: 0 
            } 
          }
        ],
        as: "blockedUser"
      }
    },
    { $unwind: "$blockedUser" }, // Convert array into an object
    {
      $project: {
        _id: "$blockedUser._id",
        userName: "$blockedUser.userName",
        firstName: "$blockedUser.firstName",
        lastName: "$blockedUser.lastName",
        fullName: {
          $concat: [
            { $ifNull: ["$blockedUser.firstName", ""] },
            " ",
            { $ifNull: ["$blockedUser.lastName", ""] }
          ]
        },
        avatar: "$blockedUser.avatar",
        email: "$blockedUser.email"
      }
    }
  ]);  

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Blocked users retrieved successfully",
      blockedUsers
    )
  );
});

export {
  sendFollowRequest,
  acceptFollowRequest,
  cancelFollowRequest,
  rejectFollowRequest,
  unfollowUser,
  removeFollower,
  getUserSocialProfile,
  getMyFollowerList,
  getUserFollowerList,
  getUserFollowingList,
  getFollowerRequests,
  getFollowingRequests,
  blockUser,
  unblockUser,
  getBlockedUsers,
}