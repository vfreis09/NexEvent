import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import initDb from "./models/db";
import userRoutes from "./routes/userRoutes";
import eventRoutes from "./routes/eventRoutes";
import rsvpRoutes from "./routes/rsvpRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import inviteRoutes from "./routes/inviteRoutes";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());

initDb()
  .then(() => {
    console.log("Database initialized");
    app.listen(3000);
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
  });

app.use(
  "/api",
  userRoutes,
  eventRoutes,
  rsvpRoutes,
  notificationRoutes,
  inviteRoutes
);

app.get("/", (req, res) => {
  res.send("hello world!");
});
