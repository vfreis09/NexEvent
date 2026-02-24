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

// --- Fixed Initialization Logic ---
initDb()
  .then(() => {
    console.log("✅ Database verified and connected successfully.");

    startScheduler();

    // Railway dynamic port binding
    const PORT = process.env.PORT || 3000;
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    // If this fails, we stop everything so you can see the real error in logs
    console.error("❌ CRITICAL ERROR: Database failed to initialize:");
    console.error(error);
    process.exit(1);
  });

// --- Routes ---
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
