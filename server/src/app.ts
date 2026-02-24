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
import adminRoutes from "./routes/adminRoutes";
import searchRoutes from "./routes/searchRoutes";
import { startScheduler } from "./jobs/scheduler";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  cors({
    origin: ["https://nexevent-app.vercel.app", "http://localhost:5173"],
    credentials: true,
  }),
);

// Initialize database then start server
initDb()
  .then(() => {
    console.log("✅ Database initialized");
    startScheduler();

    // Railway dynamic port binding
    const PORT = process.env.PORT || 3000;
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  });

// API Routes
app.use(
  "/api",
  userRoutes,
  eventRoutes,
  rsvpRoutes,
  notificationRoutes,
  inviteRoutes,
  adminRoutes,
  searchRoutes,
);

app.get("/", (req, res) => {
  res.send("NexEvent API is Live!");
});
