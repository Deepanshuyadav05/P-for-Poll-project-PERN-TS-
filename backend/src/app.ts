import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import {errorHandler} from "./middlewares/global-error-middleware.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use('/api/auth', authRoutes);

app.use(errorHandler);

export default app;