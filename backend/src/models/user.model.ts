import mongoose, { Schema } from "mongoose";
import { IUser } from "../interfaces/user.interface.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

// USER SCHEMA
const userSchema: Schema<IUser> = new Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
  },
  fullName: {
    type: String,
    maxlength: 250,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  avatar: {
    type: String, // URL for profile picture
  },
  bio: {
    type: String,
    maxlength: 160,
  },
  location: {
    type: String,
    maxlength: 100,
  },
  website: {
    type: String,
    maxlength: 100,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  isVerified: {
    type: Boolean,
    default: false, // Email verification status
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  refreshToken: {
    type: String, // Store refresh token for authentication
  },
  followers: [
    {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  following: [
    {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  posts: [
    {
      type: Schema.Types.ObjectId,
      ref: "Post"
    }
  ],
  deletedAt: {
    type: Date,
    default: null, // Soft delete field for user records
  }
});

// HASH PASSWORD BEFORE SAVING
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// METHOD TO COMPARE PASSWORD
userSchema.methods.comparePassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};


// GENERATE ACCESS TOKEN
userSchema.methods.generateAccessToken = async function () {
  const token = jwt.sign(
    {
      _id: this._id,
      userName: this.userName,
      fullName: this.fullName,
      email: this.email,
      role: this.role
    },
    config.jwtAccessTokenSecret as any,
    {
      expiresIn: config.jwtAccessTokenSecretExpiresIn as any,
    }
  );
  return token;
};

// GENERATE REFRESH TOKEN
userSchema.methods.generateRefreshToken = async function () {
  const token = jwt.sign(
    {
      _id: this._id,
    },
    config.jwtRefreshTokenSecret as any,
    {
      expiresIn: config.jwtRefreshTokenSecretExpiresIn as any,
    }
  );
  return token;
};

export const User = mongoose.model<IUser>("User", userSchema);