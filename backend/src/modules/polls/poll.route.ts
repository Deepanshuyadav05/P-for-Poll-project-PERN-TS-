import {Router} from "express";
import {validateBody} from "../../middlewares/validate.middleware.js";
import {createPoll, getPoll, submitVote} from "./poll.controller.js";
import {createPollSchema, submitVoteSchema} from "./poll.zod.validation.js";
import {authenticate} from "../auth/auth.middlewares.js";
import {ensureVoterId} from "./poll.middleware.js";

const route = Router();

route.post("/createPoll", authenticate,validateBody(createPollSchema), createPoll);
route.get("/:slug", getPoll);
route.post("/:slug/vote", ensureVoterId, validateBody(submitVoteSchema), submitVote);


export default route;