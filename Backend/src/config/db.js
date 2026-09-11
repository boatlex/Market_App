import mongoose  from "mongoose"
import { ENV } from "./env.js"


export const connectDB =async()=>{
    try {
        const connected = await mongoose.connect(ENV.DB_URL)
    console.log(`MongoDB Connected Sucessfuly To:${connected.connection.host}`) 
    } catch (error) {
        console.error("MongoDB Connection Error",  error)
        process.exit(1)
    }
   
}

