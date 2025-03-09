import { z } from "zod";

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