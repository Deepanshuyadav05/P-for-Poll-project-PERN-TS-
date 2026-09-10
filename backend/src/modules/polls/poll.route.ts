import {Router} from "express";
import {validateBody} from "../../middlewares/validate.middleware.js";
import {createPoll, getPoll} from "./poll.controller.js";
import {createPollSchema} from "./poll.zod.validation.js";
import {authenticate} from "../auth/auth.middlewares.js";

const route = Router();

route.post("/createPoll", authenticate,validateBody(createPollSchema), createPoll);
route.get("/:slug", getPoll);


export default route;