import {z} from "zod"

export const questionSchema = z.object({
    questionText: z
        .string().
        trim().
        min(1, "Question is required").
        max(500, "Too big question length"),
    allowMultiple: z
        .boolean()
        .default(false),
    options: z
        .array(z.string().trim().min(1, "Option cannot be empty").max(500))
        .min(2, "A poll needs at least 2 options")
        .max(10, "Too many options")
        //to check ef 2 options not get the same content as [yes, yes]
        .refine(
        (arr) => new Set(arr.map(s => s.toLowerCase())).size === arr.length,
        "Options must be unique"
    )

}).strict()

export const createPollSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(100),
    description: z.string().trim().min(10, "Description is required").max(100).optional(),
    question: questionSchema,
    isPublic: z.boolean().default(true),
    expiresAt: z
        .string()
        .datetime({ message: "expiresAt must be an ISO datetime" })
        .optional()
        .refine(
            (val) => !val || new Date(val) > new Date(),
            "expiresAt must be in the future"
        ),
}).strict()

export type CreatePollInput = z.infer<typeof createPollSchema>;