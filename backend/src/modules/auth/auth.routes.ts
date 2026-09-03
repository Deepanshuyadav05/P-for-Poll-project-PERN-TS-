import {Router} from "express";
import {signupController, loginController, getMeController} from "./auth.controllers.js";
import {validateBody} from "../../middlewares/validate.middleware.js";
import {signupSchema, loginSchema} from "./auth.validations.zod.js";
import {authenticate} from "./auth.middlewares.js";

const route = Router();

route.post("/signup",validateBody(signupSchema) ,signupController);
route.post("/login",validateBody(loginSchema) ,loginController);
route.get("/get-me", authenticate, getMeController);

export default route;