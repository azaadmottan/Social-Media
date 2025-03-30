import { isValidObjectId } from "mongoose";
import { z } from "zod";

export const createCommentSchema = z.object({
  post: z
    .string({ message: "Post ID must be provided" })
    .refine((id) => isValidObjectId(id), { message: "Invalid post ID" }),
  parentComment: z
    .string()
    .refine((id) => isValidObjectId(id), { message: "Invalid parent comment ID" })
    .optional(),
  content: z
    .string({ message: "Comment must be provided" })
    .min(5, "Comment message at least contains 5 characters"),
});

export const editCommentSchema = z.object({
  commentId: z
  .string({ message: "Comment ID must be provided" })
  .refine((id) => isValidObjectId(id), { message: "Invalid comment ID" }),
  content: z
    .string({ message: "Comment must be provided" })
    .min(5, "Comment message at least contains 5 characters")
});