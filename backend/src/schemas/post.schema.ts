import { isValidObjectId } from "mongoose";
import { z } from "zod";

// Create new post
export const createPostSchema = z.object({
  content: z.string().optional(),
  postImages: z
    .array(
      z.any()
      .refine(
        (file) => file && typeof file === "object" && file.mimetype?.startsWith("image/"), {
          message: "Invalid file format",
        }
      )
    )
    .optional(),
  mentions: z
    .array(
      z.string()
      .refine((id) => isValidObjectId(id), { message: "Invalid mention user's ID" })
    )
    .optional(),
  visibility: z
    .enum(["Public", "Private", "FriendsOnly"]).default("Public")
})
.refine((data) => data.content || (data.postImages && data.postImages.length > 0), {
  message: "Either content or at least one image is required.",
  path: ["content", "postImages"],
});

// Edit post details
export const editPostDetailSchema = z.object({
  content: z.string().optional(),
  mentions: z
    .array(
      z.string()
      .refine((id) => isValidObjectId(id), { message: "Invalid mention user's ID" })
    )
    .optional(),
  visibility: z
    .enum(["Public", "Private", "FriendsOnly"]).optional()
})

// Edit post images
export const editPostImageSchema = z.object({
  postImages: z
    .array(
      z.any()
      .refine(
        (file) => file && typeof file === "object" && file.mimetype?.startsWith("image/"), {
          message: "Invalid file format",
        }
      )
    )
    .optional(),
  removeImagePublicIds: z
    .array(
      z.string()
    ).optional(),
})

// Get all posts
export const getAllPostSchema = z.object({
  userProfileId: z
    .string()
    .refine((id) => isValidObjectId(id), { message: "Invalid user profile ID" })
    .optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
})
