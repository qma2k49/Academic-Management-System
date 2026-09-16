import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import connectDB from './configs/db.js'

dotenv.config();

const app = express();

app.use(express.json());

// Connect to database
connectDB();

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});