// models/pushSubscription.model.ts
import { Schema, model, models, Model, Types } from "mongoose";

// ─── Interface ────────────────────────────────────────────────────────────────
export interface IPushSubscription {
  _id:       Types.ObjectId;
  userId:    Types.ObjectId;
  endpoint:  string;
  keys: {
    p256dh: string;
    auth:   string;
  };
  userAgent?:  string;
  createdAt:   Date;
  updatedAt:   Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    endpoint: {
      type:     String,
      required: true,
      unique:   true,     // one doc per browser/device
    },
    keys: {
      p256dh: { type: String, required: true },
      auth:   { type: String, required: true },
    },
    userAgent: {
      type:    String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index for fast lookup — all subs for a user
PushSubscriptionSchema.index(
  { userId: 1, createdAt: -1 },
  { name: "user_subscriptions" }
);

export const PushSubscriptionModel: Model<IPushSubscription> =
  models.PushSubscription ??
  model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);