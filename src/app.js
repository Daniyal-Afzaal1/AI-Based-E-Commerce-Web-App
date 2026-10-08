import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

app.use(
    cors(
        {
            origin: [process.env.FRONTEND_URL, process.env.DASHBOARD_URL],
            methods: ["GET","POST","PUT","DELETE"],
            credentials: true
        }
    )
);

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

app.use(errorMiddleware);

//routes
import userRouter from "./routes/user.routes.js"
app.use("/api/v1/users", userRouter);

export {app}