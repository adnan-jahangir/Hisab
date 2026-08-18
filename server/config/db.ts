import mongoose from 'mongoose';

const ATLAS_FALLBACK_URI = 'mongodb+srv://adnan:23154@cluster0.qffk0tp.mongodb.net/amr-hisab?retryWrites=true&w=majority&appName=Cluster0';

export const connectDB = async () => {
  // Reuse existing connection in Vercel Serverless environment
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const connStr = process.env.MONGODB_URI || ATLAS_FALLBACK_URI;
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB Atlas Connected successfully!');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};
