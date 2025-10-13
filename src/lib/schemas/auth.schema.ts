import { z } from "zod";

/**
 * Schema for validating the POST /api/auth/login request body.
 * Validates email and password credentials for user authentication.
 */
export const LoginSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email format" })
    .min(1, { message: "Email is required" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .min(1, { message: "Password is required" }),
});

/**
 * Schema for validating the POST /api/auth/register request body.
 * Validates email, password and password confirmation for user registration.
 */
export const RegisterSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email format" })
    .min(1, { message: "Email is required" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .min(1, { message: "Password is required" }),
  confirmPassword: z
    .string()
    .min(1, { message: "Password confirmation is required" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

/**
 * Schema for validating the POST /api/auth/forgot-password request body.
 * Validates email for password reset process.
 */
export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email format" })
    .min(1, { message: "Email is required" }),
});

/**
 * Schema for validating the POST /api/auth/reset-password request body.
 * Validates new password and password confirmation for password reset.
 */
export const ResetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .min(1, { message: "Password is required" }),
  confirmPassword: z
    .string()
    .min(1, { message: "Password confirmation is required" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

/**
 * Type inference for LoginSchema
 */
export type LoginSchemaType = z.infer<typeof LoginSchema>;

/**
 * Type inference for RegisterSchema
 */
export type RegisterSchemaType = z.infer<typeof RegisterSchema>;

/**
 * Type inference for ForgotPasswordSchema
 */
export type ForgotPasswordSchemaType = z.infer<typeof ForgotPasswordSchema>;

/**
 * Type inference for ResetPasswordSchema
 */
export type ResetPasswordSchemaType = z.infer<typeof ResetPasswordSchema>;
