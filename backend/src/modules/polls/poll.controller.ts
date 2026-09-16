import {createPollSchema} from "./poll.zod.validation.js";
import * as pollService from "./poll.service.js";
import type {Response, Request} from "express";
import {ApiResponse} from "../../utils/api-response.js";

export async function createPoll(req: Request, res: Response) {

    // req.userId is set by the authenticate middleware from the verified JWT in the cookie — the client has no way to control or fake this value.
    // - req.body.userId is whatever the client puts in their request body — completely under the client's control
    const {poll, question, options} = await pollService.createPoll(req.userId, req.body);

    return ApiResponse.created(res, "Poll created successfully", {poll, question, options});

}

export async function getPoll(req: Request, res: Response) {

    //as string tells TypeScript "treat this as a string, full stop" — overriding the wider union — versus ! which just removes nullishness from whatever the type already is.
    const {publicPoll, question, options} = await pollService.getPollBySlug(req.params.slug as string);

    return ApiResponse.ok(res, "Fetched poll successfully", {publicPoll, question, options});
}

export async function submitVote(req: Request, res: Response) {
    const result = await pollService.submitVoteService(req.params.slug as string, req.voterId as string, req.body.optionIds);
    return ApiResponse.created(res, "Vote submitted successfully", result)

}

export async function getResults(req: Request, res: Response) {
    const result = await pollService.getResultsService(req.params.slug as string);
    return ApiResponse.ok(res, "Results fetched successfully", result)
}

export async function getMyPollList(req: Request, res: Response) {
    // req.userId is set by the authenticate middleware from the verified JWT in the cookie — the client has no way to control or fake this value.
    // - req.body.userId is whatever the client puts in their request body — completely under the client's control
    const result = await pollService.listMyPollsService(req.userId as string);
    return ApiResponse.ok(res, "Fetched poll list successfully", result)
}