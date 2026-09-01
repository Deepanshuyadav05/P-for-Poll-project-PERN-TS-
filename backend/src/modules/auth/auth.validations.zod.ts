import {z} from 'zod'
// what a valid signup payload looks like (name length, email format, password length, no extra keys). It also exports the inferred SignupInput type, which auth.services.ts uses as its
//     parameter type.

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

const loginSchema = z
    .object({
        email: emailSchema,
        password: passwordSchema
    })
.strict()

type LoginInput = z.infer<typeof loginSchema>;

export { signupSchema, type SignupInput, loginSchema ,type LoginInput };