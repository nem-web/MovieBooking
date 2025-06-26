import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import { requireAuth } from '@clerk/express';
import webhookRoute from './routes/webhook.js';

const app = express();
const port = 4000;

await connectDB();

// Webhook route needs raw body
app.use("/api/webhook", webhookRoute);

// Middleware
app.use(express.json())
app.use(cors());
app.use(clerkMiddleware())


// API Routes
app.get('/', (req, res)=> res.send('server is running'))
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use('/api/show', showRouter)
app.use('/api/booking', bookingRouter)
app.use('/api/admin', adminRouter)
app.use('/api/user', userRouter);


app.listen(port, ()=> console.log(`Server is running on port ${port}`));

