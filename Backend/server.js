import express from 'express';
import dotenv from 'dotenv';
import connectDB from './configs/db.js';
import apiRouter from './routes/index.route.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());


// Mount API Routes (Authentication & RBAC)
app.use('/api/v1', apiRouter);

app.get('/', (req, res) => {
    res.json({ message: 'Academic Management System API (Authentication & RBAC Active)' });
});

// Connect to MongoDB
connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});