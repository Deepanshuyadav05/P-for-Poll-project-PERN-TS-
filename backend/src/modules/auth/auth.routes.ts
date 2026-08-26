import {Router} from "express";
import {signupController} from "./auth.controllers.js";
import {validate} from "../../middlewares/validate.middleware.js";
import {signupSchema} from "./auth.validations.zod.js";

const route = Router();

route.post("/signup", signupController);

export default route;