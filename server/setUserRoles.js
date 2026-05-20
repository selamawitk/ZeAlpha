import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const setUserRoles = async () => {
    const uri = process.env.MONGO_URI;

    try {
        await mongoose.connect(uri);

        const updates = [
            { email: 'selamawitkinetibeb@gmail.com', role: 'couple' },
            { email: 'kim742355@gmail.com', role: 'admin' }
        ];

        for (const update of updates) {
            const user = await User.findOneAndUpdate(
                { email: update.email },
                { role: update.role },
                { returnDocument: 'after' }
            );

            if (user) {
                console.log(`✅ ${update.email} -> ${update.role}`);
            } else {
                console.log(`❌ User '${update.email}' not found.`);
            }
        }

        // Optionally handle endyk2441@gmail.com
        const endyUser = await User.findOne({ email: 'endyk2441@gmail.com' });
        if (endyUser) {
            console.log(`ℹ️  endyk2441@gmail.com exists with role: ${endyUser.role} (unchanged)`);
        } else {
            console.log(`ℹ️  endyk2441@gmail.com not found.`);
        }

        process.exit();
    } catch (err) {
        console.error("❌ Connection failed:", err.message);
        process.exit(1);
    }
};

setUserRoles();