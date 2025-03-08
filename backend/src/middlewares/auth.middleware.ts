import { NextFunction } from "express";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { IAuthenticatedRequest } from "../interfaces/user.interface.js";
import { config } from "../config/config.js";
import { User } from "../models/user.model.js";

const authenticateUser = asyncHandler(async (req: IAuthenticatedRequest, _, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  
    if (!token) {
      throw new ApiError(401, "Unauthorized access");
    }
  
    const decodedToken = jwt.verify(
      token, 
      config.jwtAccessTokenSecret as string
    ) as { _id: string };
  
    if (!decodedToken) {
      throw new ApiError(401, "Invalid Access Token.");
    }
  
    const user = await User.findById(decodedToken._id).select("-password -refreshToken");
  
    if (!user) {
      throw new ApiError(401, "User does not exist.");
    }
  
    // Attach user data to request object
    req.user = user;
  
    // Proceed to next middleware/controller
    next();
  } catch (error: any) {
    throw new ApiError(401, error?.message || "Invalid or expired access token");
  }
});

export { authenticateUser };