import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string().min(1, { message: "Please enter your username / email"})
    .refine(
      (value) => /\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/.test(value) ||
        /^[a-zA-Z0-9_]+$/.test(value),
        {
          message: "Please enter valid user credentials"
        }
    ),
  password: z
    .string().min(1, { message: "Please enter your password"})
    .min(8, { message: "Invalid password"})
});