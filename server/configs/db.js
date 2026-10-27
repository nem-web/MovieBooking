import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(
      `${process.env.MONGODB_URI}/quickshow`,
      { serverSelectionTimeoutMS: 10000 }
    );

    console.log("MongoDB connected successfully");
  }
  catch (error) {
    console.log("MongoDB connection failed", error.message);
    throw error;
  }
};

export default connectDB;