import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') }); 

const deleteUser = async () => {
    const uri = process.env.MONGO_URI; 
    
    try {
        await mongoose.connect(uri);
        
        // Find and delete Endy's account
        const result = await User.findOneAndDelete({ email: 'endyk2441@gmail.com' });

        if (result) {
            console.log("\n🗑️  USER DELETED SUCCESSFULLY!");
            console.log(`Removed: ${result.name} (${result.email})`);
        } else {
            console.log("❌ ERROR: User 'endyk2441@gmail.com' not found.");
        }
        
        process.exit();
    } catch (err) {
        console.error("❌ Operation failed:", err.message);
        process.exit(1);
    }
};

deleteUser();