import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { IAuthenticatedRequest, IUser } from "../interfaces/user.interface.js";
import { Response } from "express";
import { UserModel } from "../models/user.model.js";
import { userSchema } from "../schemas/user.schema.js";
import { sendOTPEmail } from "../emails/sendOtpEmail.js";

// Generate Access & Refresh Token
const generateAccessAndRefreshToken = async (userId: string) => {
  try {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error while generating access & refresh token");
  }
}

// User registration
const registerUser = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const validatedData = userSchema.parse(req.body);

  let isUserExisted = await UserModel.findOne({
    $or: [ 
      { 
        userName: validatedData.userName,
      }, 
      {
        email: validatedData.email, 
      } 
    ],
  });

  // Declare access & refresh tokens
  let responseAccessToken: string;
  let responseRefreshToken: string;

  // Generate 6-digits OTP code
  const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

  // OTP code valid only for 10 minutes
  const codeExpiry = new Date();
  codeExpiry.setMinutes(codeExpiry.getMinutes() + 10);

  if (isUserExisted) {
    if (isUserExisted.isVerified) {
      throw new ApiError(400, "User with this username or email already exists");
    } else {
      let {accessToken, refreshToken} = await generateAccessAndRefreshToken(isUserExisted._id);

      isUserExisted.password = validatedData.password;
      isUserExisted.verifyCode = verifyCode;
      isUserExisted.codeExpiry = codeExpiry;
      isUserExisted.isVerified = false;
      isUserExisted.refreshToken = refreshToken;

      const saveExistingUser = await isUserExisted.save();

      if (!saveExistingUser) {
        throw new ApiError(500, "User registration failed");
      }

      responseAccessToken = accessToken;
      responseRefreshToken = refreshToken;
    }
  } else {
    const newUser = await UserModel.create({
      userName: validatedData.userName,
      email: validatedData.email,
      password: validatedData.password,
      verifyCode,
      codeExpiry,
      isVerified: false,
    });
    
    if (!newUser) {
      throw new ApiError(500, "User registration failed");
    }
    
    let {accessToken, refreshToken} = await generateAccessAndRefreshToken(newUser._id);

    newUser.refreshToken = refreshToken;

    const saveNewUser = await newUser.save();

    if (!saveNewUser) {
      throw new ApiError(500, "Failed to save token");
    }

    responseAccessToken = accessToken;
    responseRefreshToken = refreshToken;

    // Store the new user in the isUserExisted variable
    isUserExisted = saveNewUser;
  }

  const isSendOtpEmail = await sendOTPEmail(validatedData.userName, validatedData.email, verifyCode);

  if (!isSendOtpEmail) {
    throw new ApiError(500, "Failed to send OTP, please try again later");
  }

  const options = {
    httpOnly: true,
    secure: true,
  }

  return res.status(201)
  .cookie("accessToken", responseAccessToken, options)
  .cookie("refreshToken", responseRefreshToken, options)
  .json(
    new ApiResponse(
      201,
      "User registered successfully, please verify your email address",
      {
        user: {
          _id: isUserExisted._id,
          userName: isUserExisted.userName,
          email: isUserExisted.email,
          isVerified: isUserExisted.isVerified,
          createdAt: isUserExisted.createdAt,
          updatedAt: isUserExisted.updatedAt,
        },
        token: {
          accessToken: responseAccessToken,
        }
      }
    )
  );
});

export {
  registerUser,
}