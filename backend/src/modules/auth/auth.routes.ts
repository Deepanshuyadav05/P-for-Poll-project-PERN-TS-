import {Router} from "express";
import {signupController} from "./auth.controllers.js";
import {validateBody} from "../../middlewares/validate.middleware.js";
import {signupSchema} from "./auth.validations.zod.js";

const route = Router();

route.post("/signup",validateBody(signupSchema) ,signupController);

export default route;