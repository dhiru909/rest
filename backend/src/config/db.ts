import mongoose from "mongoose";
import { config } from "./config";
import { error, log } from "console";
const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
        console.log(`MongoDB connected successfully`);
      });
      mongoose.connection.on("error", (err) => {
        log(`error in connecting to database`, err);
      });
    await mongoose.connect(config.databaseUrl as string),{ useNewUrlParser: true };
    
  } catch (err) {
    console.log("failed to connect to database ", err);
    process.exit(1);
  }
};

export default connectDB;