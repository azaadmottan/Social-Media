import mongoose from "mongoose";
import { config } from "../config/config.js";

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoDbUri as string, {
      dbName: config.dbName as string,
    });

    console.log(`\n✅ Database connected successfully: ${conn.connection.name}\n`);

    conn.connection.on("error", (error) => {
      console.error(`\n✅ Database connection failed !\nError: ${error}\n`);
    });
  } catch (error) {
    console.error(`\n❌ Error while connecting to Database: ${error}\n`);
    process.exit(1);
  }
}

export { connectDB };