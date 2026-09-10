import {createPollSchema} from "./poll.zod.validation.js";
import * as pollService from "./poll.service.js";
import type {Response, Request} from "express";
import {ApiResponse} from "../../utils/api-response.js";

export async function createPoll(req: Request, res: Response) {

    const {poll, question, options} = await pollService.createPoll(req.userId, req.body);

    return ApiResponse.created(res, "Poll created successfully", {poll, question, options});

}

export async function getPoll(req: Request, res: Response) {

    //as string tells TypeScript "treat this as a string, full stop" — overriding the wider union — versus ! which just removes nullishness from whatever the type already is.
    const {poll, question, options} = await pollService.getPollBySlug(req.params.slug as string);

    return ApiResponse.ok(res, "Fetched poll successfully", {poll, question, options});
}