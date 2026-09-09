import db from '../../db/index.js'
import {pollTable, optionTable, questionTable} from "../../db/schema.js";
import type {createPollInput} from "./poll.zod.validation.js";
import {makeSlug} from "./poll.utils.js";
import {ApiError} from "../../utils/api-error.js";

export async function createPoll(userId:string, input: createPollInput){
    const slug = makeSlug(input.title)

    const result = await db.transaction(async (tx)=>{
        const [poll] = await tx
            .insert(pollTable)
            .values({
                userId: userId,
                title: input.title,
                description: input.description,
                slug: slug,
                isPublic: input.isPublic,
                expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
            })
            .returning()
        // .returning() always resolves to an array of rows, even though you know only one row was inserted. TypeScript has no way to prove the array is non-empty just from reading .insert().values() — for all it knows,
        //   an array could come back empty — so const [poll] = ... types poll as PollRow | undefined, not just PollRow. The if (!poll) throw ... line is a type guard: once it's passed, TypeScript narrows poll from PollRow | undefined down
        //   to just PollRow for every line after it, so poll.id on the next insert type-checks cleanly. It's less "this will realistically happen" and more "prove to strict TypeScript it can't happen here, or fail loudly if it somehow
        //   does.
        if (!poll) throw ApiError.internal("Failed to create poll");

        const [question] = await tx
            .insert(questionTable)
            .values({
                pollId: poll.id,
                //input.question is entire nested object
                questionText: input.question.questionText,
                allowMultiple: input.question.allowMultiple,
            })
        .returning()
        if (!question) throw ApiError.internal("Failed to create poll");

        //.values() was given an array of option objects (bulk insert), so .returning() gives back an array of all inserted rows — not a single row like the poll/question inserts. Destructuring const [option]
        //   = ... only grabs the first option and discards the rest. You want the whole array here, not one element
        const options = await tx
            .insert(optionTable)
            .values(
                input.question.options.map((text, index) => (
                    {
                        questionId: question.id,
                        optionText: text,
                        displayOrder: index,
                    }
                ))
            )
        .returning()

        return { poll, question, options };
    })

    return result;
}