import express from "express"
import cors from "cors";
import { clerkMiddleware} from '@clerk/express';
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";


const app = express()
const PORT = ENV.PORT || 3000 
app.use(cors({
  //origin: ENV.CLIENT_URL, 
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

const connectServer = async () => {
  try {
    await connectDB()
    if (process.env.NODE_ENV !== "production") {
     app.listen(PORT, () => console.log(`Server is Running At Port: ${PORT}`))
    }
  } catch (error) {
    console.log(" Error Connecting to the Server:", error.message)
    process.exit(1)
  }
}
connectServer()

// export for vercel
//export default app




