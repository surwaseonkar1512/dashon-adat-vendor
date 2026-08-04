import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

import path from 'path';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Connect to MongoDB
connectDB();

// Basic route
app.get('/', (req, res) => {
  res.send('ADAT Platform API is running...');
});

import superadminRoutes from './routes/superadmin.routes';
import vendorRoutes from './routes/vendor.routes';
app.use('/api/v1/superadmin', superadminRoutes);
app.use('/api/v1/vendor', vendorRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
