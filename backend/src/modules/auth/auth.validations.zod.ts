import {z} from 'zod'

// Reusable pieces
const emailSchema = z
    .email({ error: "Email is required" })
    .trim()
    .toLowerCase();

const passwordSchema = z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters") // bcrypt truncates at 72 bytes

// SIGNUP
const signupSchema = z
    .object({
        name: z
            .string({ error: "Name is required" })
            .trim()
            .min(2, "Name must be at least 2 characters")
            .max(50, "Name must be at most 50 characters"),
        email: emailSchema,
        password: passwordSchema
    })
    .strict() // reject unknown keys — important for auth endpoints

type SignupInput = z.infer<typeof signupSchema>;

export { signupSchema, type SignupInput };