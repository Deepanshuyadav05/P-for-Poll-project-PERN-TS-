import {Router} from "express";
import {validateBody} from "../../middlewares/validate.middleware.js";
import {createPoll} from "./poll.controller.js";
import {createPollSchema} from "./poll.zod.validation.js";
import {authenticate} from "../auth/auth.middlewares.js";

const route = Router();

route.post("/createPoll", authenticate,validateBody(createPollSchema), createPoll);


export default route;