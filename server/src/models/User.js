import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ['couple', 'guest', 'admin'],
      default: 'guest'
    },

    profilePicture: {
      type: String,
      default: ''
    },

    phoneNumber: {
      type: String,
      default: ''
    },

    managedWedding: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wedding',
      default: null
    },

    resetPasswordToken: {
      type: String,
      default: null
    },

    resetPasswordExpires: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Indexes
userSchema.index({ email: 1 });

// Create model
const User = mongoose.model('User', userSchema);

// Export model (IMPORTANT FIX)
export default User;