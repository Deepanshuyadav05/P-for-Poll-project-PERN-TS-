import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes.js";
import pollRoutes from "./modules/polls/poll.route.js";
import {errorHandler} from "./middlewares/global-error-middleware.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes)

app.use(errorHandler);

export default app;