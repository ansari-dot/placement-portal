import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/portal';

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