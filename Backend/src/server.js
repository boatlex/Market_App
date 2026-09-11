import express from "express"
import cors from "cors";
import { clerkMiddleware} from '@clerk/express';
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";

import userRoutes from "./routes/user.routes.js"

const app = express()
const PORT = ENV.PORT || 3000 

app.use(cors({
  origin: true, 
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-cid-error"], 
  exposedHeaders: ["x-cid-error"] 
}));

app.use(clerkMiddleware())
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.status(200).json({ message: "Success App"})
})

app.use("/api/users", userRoutes)


app.use((err, req, res, next) => {
  console.error("❌ Backend Error:", err.stack || err.message)
  const statusCode = err.status || 500
  
  res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong on the server.",
    ...(ENV.NODE_ENV === "development" && { stack: err.stack })
  });
});

const connectServer = async () => {
  try {
    await connectDB()
    if (ENV.NODE_ENV !== "production" && !ENV.IS_VERCEL) {
     app.listen(PORT, () => console.log(`Server is Running At Port: ${PORT}`))
    }
  } catch (error) {
    console.log(" Error Connecting to the Server:", error.message)
    process.exit(1)
  }
}
connectServer()

// export for vercel
export default app
