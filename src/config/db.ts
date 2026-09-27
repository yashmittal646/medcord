import mongoose from 'mongoose';
import { ENV } from './environment.js';

export const connectDB = async (): Promise<typeof mongoose | null> => {
  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error: any) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (ENV.NODE_ENV === 'production') {
      process.exit(1);
    }
    console.warn(`⚠️ Running in fallback mode. Ensure MongoDB is running locally or provide a valid MONGODB_URI.`);
    return null;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected successfully.');
});
