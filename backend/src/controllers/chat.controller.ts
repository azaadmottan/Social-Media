import { isValidObjectId, Types } from "mongoose";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ChatModel } from "../models/chat.model.js";
import { ApiResponse } from "../utils/apiResponse.js";

// Create One-to-One Chat
const createChat = asyncHandler(async (req: any, res: Response) => {
  const { userId } = req.body;
  const currentUserId = req.user?._id;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  let chat = await ChatModel.findOne({
    isGroupChat: false,
    members: { $all: [currentUserId, userId] },
  });

  if (chat) {
    return res.status(200).json(new ApiResponse(200, "Chat already exists", chat));
  }

  chat = await ChatModel.create({
    members: [currentUserId, userId],
  });

  return res.status(201)
  .json(
    new ApiResponse(
      201, 
      "Chat created successfully", 
      chat
    )
  );
});

// Create Group Chat
const createGroupChat = asyncHandler(async (req: any, res: Response) => {
  const { users, groupName, groupAvatar } = req.body;
  const currentUserId = req.user?._id;

  if (!users || users.length < 2) {
    throw new ApiError(400, "Group must contain at least 3 members");
  }

  const chat = await ChatModel.create({
    members: [...users, currentUserId],
    isGroupChat: true,
    groupName,
    groupAvatar: groupAvatar || null,
    groupCreatedBy: currentUserId,
  });

  return res.status(201)
  .json(
    new ApiResponse(
      201, 
      "Group chat created successfully", 
      chat
    )
  );
});

// Get All Chats for Logged-in User
const getAllChats = asyncHandler(async (req: any, res: Response) => {
  const currentUserId = req.user?._id;

  const chats = await ChatModel.find({
    members: currentUserId,
  })
    .populate("members", "_id userName avatar")
    .populate("groupCreatedBy", "_id userName")
    .sort({ updatedAt: -1 });

  return res.status(200)
  .json(
    new ApiResponse(
      200, 
      "Chats fetched successfully", 
      chats
    )
  );
});

// Get Chat By ID
const getChatById = asyncHandler(async (req: Request, res: Response) => {
  const { chatId } = req.params;

  if (!isValidObjectId(chatId)) {
    throw new ApiError(400, "Invalid chat ID");
  }

  const chat = await ChatModel.findById(chatId)
    .populate("members", "_id userName avatar")
    .populate("groupCreatedBy", "_id userName");

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200, 
      "Chat fetched successfully", 
      chat
    )
  );
});

// Rename Group Chat
const renameGroupChat = asyncHandler(async (req: any, res: Response) => {
  const { chatId } = req.params;
  const { groupName } = req.body;

  if (!isValidObjectId(chatId)) {
    throw new ApiError(400, "Invalid chat ID");
  }

  const chat = await ChatModel.findOneAndUpdate(
    { _id: chatId, isGroupChat: true },
    { groupName },
    { new: true }
  );

  if (!chat) {
    throw new ApiError(404, "Group chat not found");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200, 
      "Group name updated", 
      chat
    )
  );
});

// Add User to Group Chat
const addToGroup = asyncHandler(async (req: any, res: Response) => {
  const { chatId } = req.params;
  const { userId } = req.body;

  const chat = await ChatModel.findOneAndUpdate(
    { _id: chatId, isGroupChat: true },
    { $addToSet: { members: userId } },
    { new: true }
  );

  if (!chat) {
    throw new ApiError(404, "Group chat not found");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200, 
      "User added to group", 
      chat
    )
  );
});

// Remove User from Group Chat
const removeFromGroup = asyncHandler(async (req: any, res: Response) => {
  const { chatId } = req.params;
  const { userId } = req.body;

  const chat = await ChatModel.findOneAndUpdate(
    { _id: chatId, isGroupChat: true },
    { $pull: { members: userId } },
    { new: true }
  );

  if (!chat) {
    throw new ApiError(404, "Group chat not found");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200, 
      "User removed from group", 
      chat
    )
  );
});

// Get user chat room id's
const getUserChatRoomIds = async (userId: Types.ObjectId | string): Promise<string[]> => {
  const chats = await ChatModel.find({
    members: userId
  }).select("_id");

  return chats.map((chat) => chat._id!.toString());
};

export {
  createChat,
  createGroupChat,
  getAllChats,
  getChatById,
  renameGroupChat,
  addToGroup,
  removeFromGroup,
  getUserChatRoomIds,
}