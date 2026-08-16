import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db_config.js'
import cors from 'cors';

import studentRoutes from './routes/student.route.js';
import workflowRoutes from './routes/workflow.route.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/students', studentRoutes);
app.use('/workflows', workflowRoutes);

app.get('/', (req, res) => {
    return res.status(200).json({ message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;

// Connect to DB then start server
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    });