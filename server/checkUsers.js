import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";

dotenv.config();

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const users = await User.find({}).lean(); 
    // 👆 IMPORTANT FIX: converts to plain JS objects

    console.log("\n--- ZEALPHA USERS ---");

    console.table(
      users.map(u => ({
        name: u.name,
        email: u.email,
        role: u.role
      }))
    );

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();