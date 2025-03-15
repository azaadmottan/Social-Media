import { isValidObjectId } from "mongoose";
import { z } from "zod";

// Register user
export const userSchema = z.object({
  userName: z.string({ required_error: "Username must be provided" })
    .min(3, "Username must be at least 3 characters long")
    .trim()
    .toLowerCase(),
  fullName: z.string()
    .max(250, "Full name cannot exceed 250 characters")
    .optional(),
  email: z.string({ required_error: "Email-id must be provided" })
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
  password: z.string({ required_error: "Password must be provided" })
    .regex(
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])(?=.*[a-zA-Z]).{8,}$/,
      "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  avatar: z.string().url("Invalid URL").optional(),
  bio: z.string()
    .max(400, "Bio cannot exceed 400 characters")
    .optional(),
  location: z.string()
    .max(200, "Location cannot exceed 200 characters")
    .optional(),
  website: z.string()
    .max(200, "Website URL cannot exceed 200 characters")
    .url("Invalid URL")
    .optional(),
  role: z.enum(["user", "admin"]).default("user"),
  isVerified: z.boolean().default(false),
  isBanned: z.boolean().default(false),
  refreshToken: z.string().optional(),
  followers: z.array(z.string()).default([]),
  following: z.array(z.string()).default([]),
  posts: z.array(z.string()).default([]),
  deletedAt: z.date().nullable().default(null),
});

// OTP verification
export const verifyOtpSchema = z.object({
  verifyCode: z.string({ required_error: "OTP must be provided"})
  .length(6, "OPT must be 6 digits long"),
});

// Login user
export const loginSchema = z.object({
  identifier: z.string({ required_error: "Identifier must be provided" })
  // .min(3, "Identifier must be at least 3 characters long")
  .refine(
    (value) => /\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/.test(value) || /^[a-zA-Z0-9_]+$/.test(value),
    "Identifier must be a valid email address or username"
  ),
  password: z.string({ required_error: "Password must be provided" })
  .min(8, "Password must be at least 8 characters long"),
});

// Update password
export const updatePasswordSchema = z.object({
  currentPassword: z.string({ required_error: "Current password is required" })
  .min(8, "Current password must be at least 8 characters long"),
  newPassword: z.string({ required_error: "New password is required" })
  .min(8, "New password must be at least 8 characters long")
  .regex(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])(?=.*[a-zA-Z]).{8,}$/,
    "New password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  ),
  confirmPassword: z.string({ required_error: "Confirm password is required" }),
})
.refine((data) => data.newPassword === data.confirmPassword, {
  message: "Confirm password must match with new password",
  path: ["confirmPassword"],
});

// Refresh token
export const refreshTokenSchema = z.object({
  refreshToken: z.string({ required_error: "Refresh token is required" })
  .regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/, "Invalid refresh token format")
});

// User role
export const userRoleSchema = z.object({
  id: z.string({ required_error: "User ID is required" })
  .refine((id) => isValidObjectId(id), { message: "Invalid user ID" }),
  role: z.enum(["user", "admin"], { message: "Invalid role" }),
});

// User profile (update)
export const updateUserProfileSchema = z.object({
  userName: z.string({ required_error: "Username is required" })
  .min(3, "Username must be at least 3 characters long")
  .max(20, "Username cannot exceed 20 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  fullName: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
});

// Email validation
export const emailValidationSchema = z.object({
  email: z.string({ required_error: "Email-id is required" })
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
});

// Password validation
export const passwordValidationSchema = z.object({
  password: z.string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters long"),
});

// Account verification code
export const accountActivationCodeSchema = z.object({
  email: z.string({ required_error: "Email-id is required" })
  .email("Invalid email address"),
  code: z.string({ required_error: "Account activation code is required" })
  .length(4, "Account activation code must be 4 digits long"),
});

// Route parameters id validation (Get user by id)
export const getUserByIdSchema = z.object({
  id: z.string({ required_error: "User ID is required" })
  .refine((id) => isValidObjectId(id), { message: "Invalid User ID" }),
});

// Get all users
export const getAllUsersSchema = z.object({
  page: z.string().optional()
  .transform((val) => (val ? parseInt(val, 10) : 1)), 
  limit: z.string().optional()
  .transform((val) => (val ? parseInt(val, 10) : 10)),
});