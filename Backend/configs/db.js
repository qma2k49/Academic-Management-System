import mongoose from "mongoose";
import dotenv from 'dotenv';
import dns from 'dns';
import models from '../models/index.model.js';

dotenv.config();

dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log('MongoDB connected');
        for (const [modelName, Model] of Object.entries(models)) {
            if (Model && Model.createCollection) {
                await Model.createCollection().catch(() => { });
            }
        }
    } catch (error) {
        console.error('Error: ', error);
        process.exit(1);
    }
}

export default connectDB;  