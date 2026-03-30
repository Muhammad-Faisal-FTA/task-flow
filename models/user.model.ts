// models/User.ts

import mongoose, {
  Schema,
  model,
  models,
  Model,
  CallbackError,
} from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "@/types/auth";

// ─── Schema ───────────────────────────────────────────────────────────────────
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name must be at most 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,          // Creates index automatically
      trim: true,
      lowercase: true,       // Always store as lowercase — prevents duplicates
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,         // Never returned in queries unless explicitly asked
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    emailVerifyToken: {
      type: String,
      default: null,
      select: false,         // Never leak tokens in responses
    },

    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },

    resetPasswordExpiry: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,        // Adds createdAt + updatedAt automatically
    versionKey: false,       // Remove __v field from documents
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// email index already created by unique:true above
// Additional index for token lookups (forgot password + verify email flows)
UserSchema.index({ emailVerifyToken: 1 },   { sparse: true }); // sparse = only index non-null
UserSchema.index({ resetPasswordToken: 1 }, { sparse: true });

// ─── Pre-save hook: hash password ─────────────────────────────────────────────
// Only runs when password field is modified — not on every save
UserSchema.pre("save", async function (this: mongoose.Document & IUser) {
  if (!this.isModified("password")) return;

  // NFR Security: salt rounds = 12
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ─── Instance method: compare password ───────────────────────────────────────
// Used in authService.loginUser()
UserSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  // `this.password` is select:false — must be explicitly selected in query
  return bcrypt.compare(candidate, this.password);
};

// ─── Sanitize output ──────────────────────────────────────────────────────────
// Strip sensitive fields when converting to JSON / Object
// This runs whenever res.json() serializes a user document
UserSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc, ret: any) {
    delete ret.password;
    delete ret.emailVerifyToken;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpiry;
    return ret;
  },
});

// ─── Model (guard against hot-reload re-registration) ────────────────────────
export const UserModel: Model<IUser> =
  models.User ?? model<IUser>("User", UserSchema);