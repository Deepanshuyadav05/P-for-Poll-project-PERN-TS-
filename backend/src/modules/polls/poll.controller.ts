import {createPollSchema} from "./poll.zod.validation.js";
import * as pollService from "./poll.service.js";
import type {Response, Request} from "express";
import {ApiResponse} from "../../utils/api-response.js";

export async function createPoll(req: Request, res: Response) {

    const {poll, question, options} = await pollService.createPoll(req.userId, req.body);

    return ApiResponse.created(res, "Poll created successfully", {poll, question, options});

}