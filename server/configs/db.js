import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on('connected',()=> console.log('MongoDB connected successfully'));
    await mongoose.connect(`${process.env.MONGODB_URI}/quickshow`)
  }
  catch (error) {
    console.log(error.moessage);
  }
}

export default connectDB;