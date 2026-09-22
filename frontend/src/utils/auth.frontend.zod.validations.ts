import {z} from "zod";

const email = z
    .email("Invalid email address")
    .trim()
    .toLowerCase()

const password = z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")



export const signupSchema = z.object({
    name: z
        .string({ error: "Name is required" })
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name must be at most 50 characters"),
    email: email,
    password: password,
});

export type SignupFormInputs = z.infer<typeof signupSchema>

//Login schema
export const loginSchema = z.object({
    email: email,
    password: password,
});

//extracts a TypeScript type from your Zod schema, so LoginFormInputs becomes an object type matching whatever fields loginSchema validates
// (e.g. { email: string; password: string }).
export type LoginFormInputs = z.infer<typeof loginSchema>

