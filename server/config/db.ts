import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/amr-hisab';
    console.log(`Connecting to MongoDB at: ${connStr}`);
    await mongoose.connect(connStr);
    console.log('MongoDB Connected successfully!');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't exit process in dev so server can attempt re-connection or log cleanly
  }
};
