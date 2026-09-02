import {Router} from "express";
import {signupController, loginController} from "./auth.controllers.js";
import {validateBody} from "../../middlewares/validate.middleware.js";
import {signupSchema, loginSchema} from "./auth.validations.zod.js";

const route = Router();

route.post("/signup",validateBody(signupSchema) ,signupController);
route.post("/login",validateBody(loginSchema) ,loginController);

export default route;