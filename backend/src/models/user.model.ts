import mongoose, { Schema } from "mongoose";
import { IUser } from "../interfaces/user.interface.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

// User schema
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
    minlength: 8,
  },
  avatar: {
    type: String, // URL for profile picture
  },
  bio: {
    type: String,
    maxlength: 400,
  },
  location: {
    type: String,
    maxlength: 200,
  },
  website: {
    type: String,
    maxlength: 200,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  verifyCode: {
    type: String,
    default: null,
  },
  codeExpiry: {
    type: Date,
    default: null,
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
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};


// Generate access token
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

// Generate refresh token
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

export const UserModel = mongoose.model<IUser>("User", userSchema);