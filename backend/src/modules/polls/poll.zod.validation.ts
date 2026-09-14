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

export type createPollInput = z.infer<typeof createPollSchema>;

export const submitVoteSchema = z.object({
    //The scenario this protects against: say a question allows multiple choices, and a voter is supposed to pick from 3 options. Nothing on the client automatically stops a buggy (or malicious) request from sending the same option
    //   ID more than once, like:
    //   { "optionIds": ["opt-1", "opt-1", "opt-2"] }
    //   If that gets through unchecked, your service will later insert one row into voteTable per array element — so opt-1 would get two vote rows from a single vote submission, while opt-2 gets one. That's ballot-stuffing a single
    //   option, and it'd silently corrupt your tally counts. The duplicate check exists purely to reject a payload like that before it ever reaches the database.
    //
    //   What new Set(arr).size === arr.length actually does, step by step:
    //   - arr is the array as submitted, e.g. ["opt-1", "opt-1", "opt-2"] → arr.length is 3.
    //   - Set is a built-in JS collection type that automatically throws away duplicates — if you feed it values it's already seen, it just keeps one copy. new Set(["opt-1", "opt-1", "opt-2"]) becomes a set containing only {"opt-1",
    //     "opt-2"}.
    //   - .size is the Set's item count — 2 in this example.
    //   - Compare: 2 === 3? False. That mismatch is exactly what tells you "something in the original array was repeated."
    optionIds: z.array(z.uuid())
        .min(1, "Select at least one option")
        .max(10, "Too many options selected")
        .refine(
            (arr) => new Set(arr).size === arr.length,
            "Duplicate option ids are not allowed"
        )
}).strict()

export type submitVoteInput = z.infer<typeof submitVoteSchema>;