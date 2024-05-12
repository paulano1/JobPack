import express from "express";
import cors from "cors";
import morgan from "morgan";

import * as middleware from "./utils/middleware.js";
import helloRoute from "./routes/helloRouter.js";
import userRoutes from "./routes/userRoutes.js";
import mongoose from "mongoose";

const app = express();

// parse json request body
app.use(express.json());

// enable cors
app.use(cors());

// request logger middleware
app.use(morgan("tiny"));

// MongoDB Atlas Connection URI
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://devaccount:HNhEZr2vYKMdQRX5@cluster0.rh9w9qh.mongodb.net/JobObjects?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI, {
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));


// healthcheck endpoint
app.get("/", (req, res) => {
  res.status(200).send({ status: "ok" });
});

app.use("/hello", helloRoute);
app.use("/api", userRoutes)

// custom middleware
app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

export default app;
