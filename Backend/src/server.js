import express from "express";
import cors from "cors";
import { createServer } from "http"; 
import { clerkMiddleware } from '@clerk/express';
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { initializeSocket } from "./socket/socket.js"; 

import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import productRoutes from "./routes/product.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import messageRoutes from "./routes/message.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import reportRoutes from "./routes/report.routes.js";
import jobRoutes from "./routes/jobs.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import jobseekerprofileRoutes from "./routes/jobseekerprofile.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import serviceproviderRoutes from "./routes/serviceprovider.routes.js";
import serviceproviderReviewRoutes from "./routes/serviceproviderReview.route.js";

const app = express();
const PORT = ENV.PORT || 3000;

// 3. Wrap Express app in an HTTP Server
const httpServer = createServer(app);

// 4. Fire up your separate socket engine
const io = initializeSocket(httpServer);

// Make 'io' globally accessible across your controllers via the request object
app.set("io", io);

// 5. Standard Middleware
app.use(cors({
  origin: true, 
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-cid-error"], 
  exposedHeaders: ["x-cid-error"] 
}));

app.use(clerkMiddleware());
app.use(express.json());

// 6. Routes
app.get("/api/health", (req, res) => {
    res.status(200).json({ message: "Success App" });
});

app.use("/api/users", userRoutes);
app.use("/api/auths", authRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/jobseekerprofiles", jobseekerprofileRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/serviceproviders", serviceproviderRoutes);
app.use("/api/reviews", serviceproviderReviewRoutes);

// 7. Error Handling
app.use((err, req, res, next) => {
  console.error("❌ Backend Error:", err.stack || err.message);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong on the server.",
    ...(ENV.NODE_ENV === "development" && { stack: err.stack })
  });
});

// 8. Server Boot up
const connectServer = async () => {
  try {
    await connectDB();
    // CRITICAL: Always listen on httpServer so WebSockets work natively on Sevalla
    httpServer.listen(PORT, () => console.log(`🚀 Server + WebSockets running on port: ${PORT}`));
  } catch (error) {
    console.log("❌ Error Connecting to the Server:", error.message);
    process.exit(1);
  }
};
connectServer();

export default app;



