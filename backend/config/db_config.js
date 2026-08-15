import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const URI = process.env.MONGO_URI

if(!URI){
    throw new Error('MONGO_URI is not defined in the environment variables');
}
// Function to connect to MongoDB
const connectDB = async()=>{
    try{
        const conn = await mongoose.connect(URI)
        console.log(`MongoDB Connected: ${conn.connection.host}`)
    } catch (error) {
        console.error('Error connecting to MongoDB:', error)
        process.exit(1)
    }
}

export default connectDB