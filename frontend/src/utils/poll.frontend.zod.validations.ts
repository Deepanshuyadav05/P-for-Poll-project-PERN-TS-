import {z} from "zod";

export const createPollSchema = z.object({
    title: z
        .string({ error: "Title is required" })
        .trim()
        .min(1, "Title must be at least 1 characters")
        .max(100, "Title must be at most 100 characters"),
    description: z
        .string({ error: "Description is required" })
        .trim()
        .min(10, "Description must be at least 10 characters")
        .max(100, "Description must be at most 100 characters")
        .optional()
        .or(z.literal("")),

    question: z
        .object({
            questionText: z
                .string({ error: "Question is required" })
                .trim()
                .min(1, "Question must be at least 1 characters")
                .max(500, "Question must be at most 500 characters"),
            allowMultiple: z.boolean().optional(),
            options: z.array(
                z.object({
                    value: z
                        .string({ error: "Option is required" })
                        .trim()
                        .min(1, "Option must be at least 1 characters")
                        .max(500, "Option must be at most 500 characters"),
                })
            )
                .min(2, "A poll needs at least 2 options")
                .max(10, "A poll can have at most 10 options")
                //Here the rule is "no two options may be the same".
                // 1. arr.map((o) => o.value.toLowerCase()) pulls the text out of each object and lowercases it, giving ["yes", "yes", "no"]. Lowercasing is what makes "Yes" and "yes" count as the same option.
                //   2. new Set(...) builds a Set, a collection that keeps only one copy of each value, so the duplicate is dropped: {"yes", "no"}.
                //   3. .size is how many items the Set holds: 2.
                //   4. === arr.length compares that to the original array's length, 3.
                // It is the same idea as the optionIds check in your backend submitVoteSchema, with an extra .map() because your options here are { value: string } objects rather than plain strings
                .refine(
                    (arr) => new Set(arr.map((o) => o.value.toLowerCase())).size === arr.length,
                    "Options must be unique"
                ),
        }),
    isPublic: z.boolean().optional(),
    expiresAt: z
        .string()
        .optional()
        .refine(
        (val) => !val || new Date(val) > new Date(),
        "Expiry must be in the future"),


})

export type CreatePollInput = z.infer<typeof createPollSchema>
