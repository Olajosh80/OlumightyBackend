import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import cors from 'cors';
import documentRouter from './routes/document.route';
// import userRouter from './routes/user.route';
// import superRouter from './routes/superadmin.routes';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const mongoURI = process.env.URI;
const port = process.env.PORT || 5000;

const server = http.createServer(app);


const connectToDatabase = async () => {
  try {
    await mongoose.connect(`${mongoURI}`, {
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds timeout
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', getErrorMessage(error));
    process.exit(1);
  }
};
connectToDatabase();


// app.post("/payment/webhook", handlePaymentWebhook);
// app.get('/getSubsciption/:telegramId', checkSubscriptionStatus);

// app.use('/api/v1/users', userRouter);
// app.use('/api/v1/super', superRouter);

app.use('/api/v1/', documentRouter);
// app.use('/api/v1/snipes', snipeRouter);
// app.use('/api/v1/wallet', walletRouter);
// app.use('/api/v1/transact', transactionRouter);
// app.use('/api/v1/admin', adminRouter);
// app.use('/api/v1/pnl', pnlCardRouter);
// app.use('/api/v1/subscriptions', subscriptionRouter);
// app.use('/api/v1/trade', tradeRouter);
// app.use('/api/v1/pay', paymentRouter);

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);

});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}
