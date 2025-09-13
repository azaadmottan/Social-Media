import { Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { config } from "../config/config.js";
import { IAuthenticatedRequest } from "../interfaces/user.interface.js";
import { UserModel } from "../models/user.model.js";
import { 
  sendAccountActivationCode, 
  sendEmailVerificationCode 
} from "../emails/sendOtpEmail.js";
import { 
  emailValidationSchema,
  getAllUsersSchema,
  getUserByIdSchema,
  loginSchema, 
  verifyOtpSchema, 
  refreshTokenSchema, 
  updatePasswordSchema, 
  updateUserProfileSchema, 
  userRoleSchema, 
  userSchema,
  accountActivationCodeSchema,
  passwordValidationSchema,
  createProfileSchema,
  updateUserProfilePictureSchema, 
} from "../schemas/user.schema.js";
import { 
  deleteOnCloudinary, 
  uploadOnCloudinary 
} from "../utils/cloudinary.js";

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
      isUserExisted.verifyCodeExpiry = codeExpiry;
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
      verifyCodeExpiry: codeExpiry,
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

  const isSendOtpEmail = await sendEmailVerificationCode(validatedData.userName, validatedData.email, verifyCode);

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
          isProfileCompleted: isUserExisted.isProfileCompleted,
          createdAt: isUserExisted.createdAt,
          updatedAt: isUserExisted.updatedAt,
        },
        token: {
          accessToken: responseAccessToken,
          refreshToken: responseRefreshToken,
        }
      }
    )
  );
});

// Verify user account with OTP
const verifyUserAccount = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const validatedData = verifyOtpSchema.parse(req.body);

  const user = await UserModel.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isVerified) {
    return res.status(200)
    .json(
      new ApiResponse(
        200,
        "User account is already verified",
        {
          user: {
            _id: user._id,
            userName: user.userName,
            email: user.email,
            isVerified: user.isVerified,
          },
        }
      )
    );
  }

  if (user.verifyCode !== validatedData.verifyCode) {
    throw new ApiError(400, "Invalid OTP code");
  }

  if (user.verifyCodeExpiry && user.verifyCodeExpiry < new Date()) {
    throw new ApiError(400, "OTP code has expired");
  }

  user.verifyCode = null;
  user.verifyCodeExpiry = null;
  user.isVerified = true;

  const saveVerifiedUser = await user.save();

  if (!saveVerifiedUser) {
    throw new ApiError(500, "Failed to verify user account");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "User account verified successfully",
      {
        user: {
          _id: saveVerifiedUser._id,
          userName: saveVerifiedUser.userName,
          email: saveVerifiedUser.email,
          isVerified: saveVerifiedUser.isVerified,
          isProfileCompleted: saveVerifiedUser.isProfileCompleted,
          createdAt: saveVerifiedUser.createdAt,
          updatedAt: saveVerifiedUser.updatedAt,
        },
      }
    )
  );
});

// Resend OTP
const resendOTP = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const user = await UserModel.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // If user is already verified
  if (user.isVerified) {
    throw new ApiError(400, "User account is already verified");
  }

  // Generate 6-digits OTP code
  const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

  // OTP code valid only for 10 minutes
  const codeExpiry = new Date();
  codeExpiry.setMinutes(codeExpiry.getMinutes() + 10);

  user.verifyCode = verifyCode;
  user.verifyCodeExpiry = codeExpiry;

  const saveUser = await user.save();

  if (!saveUser) {
    throw new ApiError(500, "Failed to generate verification code");
  }

  const isSendOtpEmail = await sendEmailVerificationCode(user.userName, user.email, verifyCode);

  if (!isSendOtpEmail) {
    throw new ApiError(500, "Failed to send OTP, please try again later");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "OTP resent successfully",
      {
        user: {
          _id: saveUser._id,
          userName: saveUser.userName,
          email: saveUser.email,
          isVerified: saveUser.isVerified,
        },
      }
    )
  );
});

// Create profile
const createProfile = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const validatedData = createProfileSchema.parse(req.body);

  const user = await UserModel.findById(req.user?._id);

  if (!user?.isVerified) {
    throw new ApiError(400, "User account is not verified");
  }

  if (user?.isProfileCompleted) {
    throw new ApiError(400, "User profile already exists");
  }

  let avatarUrl = "";
  let avatarPublicId = "";

  if (req.file) {
    const uploadAvatar = await uploadOnCloudinary(req.file?.path);

    if (!uploadAvatar) {
      throw new ApiError(500, "Failed to upload profile picture");
    }
    avatarUrl = uploadAvatar.url;
    avatarPublicId = uploadAvatar.public_id;
  }

  const createProfile = await UserModel.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatarUrl,
        avatarPublicId,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        bio: validatedData.bio,
        location: validatedData.location,
        website: validatedData.website,
        isProfileCompleted: true,
      },
    },
    { new: true }
  );

  if (!createProfile) {
    throw new ApiError(500, "Failed to create profile");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Profile created successfully",
      {
        user: {
          _id: createProfile._id,
          userName: createProfile.userName,
          email: createProfile.email,
          firstName: createProfile.firstName,
          lastName: createProfile.lastName,
          avatar: createProfile.avatar,
          bio: createProfile.bio,
          location: createProfile.location,
          website: createProfile.website,
          isVerified: createProfile.isVerified,
          isProfileCompleted: createProfile.isProfileCompleted,
          createdAt: createProfile.createdAt,
          updatedAt: createProfile.updatedAt,
        },
      }
    )
  );
});

// Login user
const loginUser = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const validatedData = loginSchema.parse(req.body);

  const user = await UserModel.findOne({
    $or: [
      { userName: validatedData.identifier },
      { email: validatedData.identifier },
    ],
  });

  if (!user) {
    throw new ApiError(404, "Invalid credentials / User not found !");
  }

  const isCorrectPassword = await user.comparePassword(validatedData.password);

  if (!isCorrectPassword) {
    throw new ApiError(401, "Incorrect password");
  }

  if (user.isBanned) {
    throw new ApiError(403, "Your account has been banned due to violations of community guidelines.");
  }

  if (!user.isActive) {
    throw new ApiError(
      403, 
      "Your account is currently deactivated. Please reactivate to continue",
      [
        {
          "requireAccountActivation": true,
        }
      ]
      
    );
  }

  let { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  user.refreshToken = refreshToken;

  const saveUser = await user.save();

  if (!saveUser) {
    throw new ApiError(500, "Failed to login user");
  }

  const options = {
    httpOnly: true,
    secure: true,
  }

  return res.status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      "User logged in successfully",
      {
        user: {
          _id: saveUser._id,
          userName: saveUser.userName,
          email: saveUser.email,
          isVerified: saveUser.isVerified,
          isProfileCompleted: saveUser.isProfileCompleted,
          createdAt: saveUser.createdAt,
          updatedAt: saveUser.updatedAt,
        },
        token: {
          accessToken: accessToken,
          refreshToken,
        },
      }
    )
  );
});

// Logout user
const logoutUser = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const user = await UserModel.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        refreshToken: 1,
      }
    },
    {
      new: true,
    }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const options = {
    httpOnly: true,
    secure: true,
  }

  return res.status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(
    new ApiResponse(
      200,
      "User logged out successfully",
    )
  );
});

// Update password
const updatePassword = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const validatedData = updatePasswordSchema.parse(req.body);

  const user = await UserModel.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isCorrectPassword = await user.comparePassword(validatedData.currentPassword);

  if (!isCorrectPassword) {
    throw new ApiError(400, "Incorrect current password");
  }

  user.password = validatedData.newPassword;

  const saveUser = await user.save({
    validateBeforeSave: false,
  });

  if (!saveUser) {
    throw new ApiError(500, "Failed to update password");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Password updated successfully",
    )
  );
});

// Refresh token
const updateToken = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  const validatedData = refreshTokenSchema.parse({
    refreshToken: incomingRefreshToken
  }); 

  try {
    const decodedToken = await jwt.verify(
      validatedData.refreshToken,
      config.jwtRefreshTokenSecret as any,
    ) as JwtPayload;

    const user = await UserModel.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (user.isBanned) {
      throw new ApiError(403, "User account is temporarily suspended");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Token has expired");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    user.refreshToken = refreshToken;

    const saveUser = await user.save();

    if (!saveUser) {
      throw new ApiError(500, "Failed to refresh token");
    }

    const options = {
      httpOnly: true,
      secure: true,
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        "Token refreshed successfully",
        {
          token: {
            accessToken: accessToken,
            refreshToken: refreshToken
          },
        }
      )
    );
  } catch (error) {
    throw new ApiError(
      401,
      "Some thing went wrong, while trying to refresh the token",
    )
  }
});

// Update user role
const updateUserRole = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const { id, role } = userRoleSchema.parse(req.body);

  const user = await UserModel.findByIdAndUpdate(
    id,
    { role },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "User role updated successfully",
      {
        user,
      }
    )
  );
});

// Get current user
const getCurrentUser = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const user = await UserModel.findById(req.user?._id)
  .select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "User retrieved successfully",
      {
        user,
      }
    )
  );
});

// Update profile picture
const updateProfilePicture = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const validatedData = updateUserProfilePictureSchema.parse({
    avatar: req.file,
  });

  const user = await UserModel.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user?.avatar && user?.avatarPublicId) {
    const deleteAvatar = await deleteOnCloudinary(user?.avatarPublicId);

    if (!deleteAvatar || deleteAvatar.result?.deleted === 0) {
      throw new ApiError(500, "Failed to update profile picture");
    }
  }

  let updatedAvatarUrl = "";
  let updatedAvatarPublicId = "";
  if (req.file?.path) {
    const uploadAvatar = await uploadOnCloudinary(req.file?.path);

    if (!uploadAvatar || uploadAvatar?.public_id === "") {
      throw new ApiError(500, "Failed to upload profile picture");
    }

    updatedAvatarUrl = uploadAvatar.url;
    updatedAvatarPublicId = uploadAvatar.public_id;
  }

  user.avatar = updatedAvatarUrl;
  user.avatarPublicId = updatedAvatarPublicId;

  const saveUser = await user.save({
    validateBeforeSave: false,
  });

  if (!saveUser) {
    throw new ApiError(500, "Failed to update profile picture");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Profile picture updated successfully",
      {
        user: {
          _id: user._id,
          userName: user.userName,
          email: user.email,
          avatar: user.avatar,
          isVerified: user.isVerified,
          isProfileCompleted: user.isProfileCompleted,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      }
    )
  );
});

// Delete profile picture
const deleteProfilePicture = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const user = await UserModel.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user?.avatar || !user?.avatarPublicId) {
    throw new ApiError(400, "User have no profile picture");
  }

  const deleteAvatar = await deleteOnCloudinary(user?.avatarPublicId);

  if (!deleteAvatar || deleteAvatar.result?.deleted === 0) {
    throw new ApiError(500, "Failed to delete profile picture");
  }

  user.avatar = null;
  user.avatarPublicId = null;

  const saveUser = await user.save({
    validateBeforeSave: false,
  });

  if (!saveUser) {
    throw new ApiError(500, "Failed to delete profile picture");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Profile picture deleted successfully",
      {
        user: {
          _id: user._id,
          userName: user.userName,
          email: user.email,
          avatar: user.avatar,
          isVerified: user.isVerified,
          isProfileCompleted: user.isProfileCompleted,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      }
    )
  );
});

// Update user account details
const updateUserAccountDetails = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const validatedData = updateUserProfileSchema.parse(req.body);

  const isUserNameExist = await UserModel.findOne({ userName: validatedData.userName });

  if (isUserNameExist && isUserNameExist._id.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "Username already exists");
  }

  const user = await UserModel.findByIdAndUpdate(
    req.user?._id,
    validatedData,
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "User account details updated successfully",
      {
        user,
      }
    )
  );
});

// Get user by id
const getUserById = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const validatedData = getUserByIdSchema.parse(req?.params);

  const user = await UserModel.findById(validatedData.id)
  .select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "User retrieved successfully",
      {
        user,
      }
    )
  );
});

// Get all users
const getAllUsers = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const validatedData = getAllUsersSchema.parse(req.query);

  const page = validatedData.page;
  const limit = validatedData.limit;

  const skip = (page - 1) * limit;

  const users = await UserModel.find()
  .select("-password -refreshToken")
  .skip(skip)
  .limit(limit);

  const totalUsers = await UserModel.countDocuments();

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Users retrieved successfully",
      {
        users,
        totalUsers,
        currentPage: page,
        limit: limit,
        totalPages: Math.ceil(totalUsers / limit),
      }
    )
  );
});

// Get account activation code
const getAccountActivationCode = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const validatedData = emailValidationSchema.parse(req.body);

  const user = await UserModel.findOne({email: validatedData.email});

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isActive) {
    throw new ApiError(400, "User account is already active");
  }

  // Generate 4-digits OTP code
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  // OTP code valid only for 10 minutes
  const codeExpiry = new Date();
  codeExpiry.setMinutes(codeExpiry.getMinutes() + 10);

  user.accountActivationCode = activationCode;
  user.activationCodeExpiry = codeExpiry;

  const saveUser = await user.save();

  if (!saveUser) {
    throw new ApiError(500, "Failed to generate activation code");
  }

  const isSendActivationCode = await sendAccountActivationCode(user.userName, user.email, activationCode);

  if (!isSendActivationCode) {
    throw new ApiError(500, "Failed to send activation code");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Account activation code has been sent to your email address"
    )
  );
});

// Verify account activation code
const verifyAccountActivationCode = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const validatedData = accountActivationCodeSchema.parse(req.body);

  const user = await UserModel.findOne({ email: validatedData.email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isActive) {
    throw new ApiError(400, "User account is already active");
  }

  if (validatedData.code !== user.accountActivationCode) {
    throw new ApiError(400, "Invalid account activation code");
  }

  if (user.activationCodeExpiry && user.activationCodeExpiry < new Date()) {
    throw new ApiError(400, "Activation code has expired");
  }

  user.isActive = true;
  user.accountActivationCode = null;
  user.activationCodeExpiry = null;

  const saveUser = await user.save();

  if (!saveUser) {
    throw new ApiError(500, "Failed to verify account activation code");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Account activated successfully, now you can login",
    )
  );
});

// Toggle account activity
const deactivateAccount = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const user = await UserModel.findByIdAndUpdate(
    req.user?._id,
    { 
      isActive: false,
      $unset: {
        refreshToken: 1,
      }
    },
    { new: true }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const saveUser = await user.save();

  if (!saveUser) {
    throw new ApiError(500, `Failed to deactivate account`);
  }

  const options = {
    httpOnly: true,
    secure: true,
  }

  return res.status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(
    new ApiResponse(
      200,
      "Account deactivated successfully & you have logged out",
    )
  );
});

// Delete account
const deleteAccount = asyncHandler(async (req: IAuthenticatedRequest, res: Response) => {
  const validatedData = passwordValidationSchema.parse(req.body);

  const user = await UserModel.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isCorrectPassword = await user.comparePassword(validatedData.password);

  if (!isCorrectPassword) {
    throw new ApiError(401, "Incorrect password");
  }

  user.deletedAt = new Date();

  const saveUser = await user.save();

  // TODO: Delete user related data in the database

  if (!saveUser) {
    throw new ApiError(500, "Failed to delete account");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      "Account deleted successfully",
    )
  );
});


export {
  registerUser,
  verifyUserAccount,
  resendOTP,
  createProfile,
  loginUser,
  logoutUser,
  updatePassword,
  updateToken,
  updateProfilePicture,
  deleteProfilePicture,
  updateUserRole,
  getCurrentUser,
  updateUserAccountDetails,
  getUserById,
  getAllUsers,
  getAccountActivationCode,
  verifyAccountActivationCode,
  deactivateAccount,
  deleteAccount,
}