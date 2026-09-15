import db from '../../db/index.js'
import {pollTable, optionTable, questionTable, responseTable, voteTable} from "../../db/schema.js";
import type {createPollInput} from "./poll.zod.validation.js";
import {makeSlug} from "./poll.utils.js";
import {ApiError} from "../../utils/api-error.js";
import {and, count, eq} from "drizzle-orm";

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

export async function getPollBySlug(slug:string){
    const [poll] = await db.select().from(pollTable).where(eq(pollTable.slug, slug)).limit(1)
    if (!poll) throw ApiError.pollNotFound();

    const [question] = await db.select().from(questionTable).where(eq(questionTable.pollId, poll.id)).limit(1)
    if(!question) throw ApiError.internal("Failed to get poll");

    //no destructuring here, you want the whole array, ordered so options display in the order they were created.
    const options = await db.select().from(optionTable).where(eq(optionTable.questionId, question.id)).orderBy(optionTable.displayOrder)

    const {userId, ...publicPoll} = poll

    return {publicPoll, question, options};

}

export async function submitVoteService(slug:string, voterId:string, optionIds:string[]){
    const [poll] = await db.select().from(pollTable).where(eq(pollTable.slug, slug)).limit(1)

    if(!poll) throw ApiError.pollNotFound();

    if(poll.expiresAt && new Date() > poll.expiresAt) throw ApiError.pollClosed()

    const [existingResponse] = await db.select().from(responseTable).where(and(eq(responseTable.pollId, poll.id), eq(responseTable.voterId, voterId))).limit(1)

    if (existingResponse) throw ApiError.alreadyVoted()

    const [question] = await db.select().from(questionTable).where(eq(questionTable.pollId, poll.id)).limit(1)
    if(!question) throw ApiError.internal();

    const options = await db.select({ id: optionTable.id }).from(optionTable).where(eq(optionTable.questionId, question.id));
    //transforms your array of option objects ([{id: "A", ...}, {id: "B", ...}, {id: "C", ...}]) into a plain array of just their IDs: ["A", "B", "C"].
    // Wrapping that in new Set(...) turns it into a Set — same values, but now optimized specifically for one operation: "is this value in here
    const validOptionIds = new Set(options.map(o => o.id));

    //.has(id) — a method that only exists on Set (not arrays). It checks whether a given value exists inside the Set, returning true or false.

    // .some(callback) — an Array method that runs your callback once per element, and returns true the moment any single element makes the callback return true (it stops checking as soon as it finds one — doesn't need to check the
    //   rest). Think of it as "is there at least one element where...?" It's the opposite of .every(), which requires all elements to pass.

    // Putting it together, walking through optionIds = ["A", "X"]:
    //   - For "A": is !validOptionIds.has("A") true? has("A") is true, so !true is false — this element doesn't trigger .some().
    //   - For "X": is !validOptionIds.has("X") true? has("X") is false, so !false is true — this element does trigger it.
    //   - Since at least one element made the callback return true, .some(...) returns true overall — meaning "yes, at least one submitted ID is not in the valid set" — so the if fires and you throw optionNotFound().
    if (optionIds.some(id => !validOptionIds.has(id))) throw ApiError.optionNotFound();

    //if dont want Set then swap it with Array
    /*const validOptionIds = options.map(o => o.id);   // plain array now, e.g. ["A", "B", "C"]
    if (optionIds.some(id => !validOptionIds.includes(id))) throw ApiError.optionNotFound();*/

    if(!question.allowMultiple && optionIds.length !== 1) throw ApiError.badRequest();


        const responseId = await db.transaction(async (tx) => {
            const [response] = await tx
                .insert(responseTable)
                .values({ pollId: poll.id, voterId }) // userId omitted → null (anonymous)
                .returning({ id: responseTable.id });

            if(!response) throw ApiError.internal()

            await tx.insert(voteTable).values(
                optionIds.map(optionId => ({ responseId: response.id, optionId }))
            )

            return response.id;
        });

        return { responseId };

}


//helper function for getResultService
async function computeResults(questionId: string) {
    return await db
        .select({
            optionId: optionTable.id,
            optionText: optionTable.optionText,
            displayOrder: optionTable.displayOrder,
            voteCount: count(voteTable.id),  //count total vote id
        })
        .from(optionTable)
        .leftJoin(voteTable, eq(voteTable.optionId, optionTable.id))
        .where(eq(optionTable.questionId, questionId))
        .groupBy(optionTable.id, optionTable.optionText, optionTable.displayOrder)
        .orderBy(optionTable.displayOrder);
}

export async function getResultsService(slug:string){
    const [poll] = await db.select().from(pollTable).where(eq(pollTable.slug, slug)).limit(1)
    if (!poll) throw ApiError.pollNotFound();

    const [question] = await db.select().from(questionTable).where(eq(questionTable.pollId, poll.id)).limit(1)
    if(!question) throw ApiError.internal("Failed to get poll");

    const results = await computeResults(question.id);

    const {userId, ...publicPoll} = poll

    return {publicPoll, question, results}
}