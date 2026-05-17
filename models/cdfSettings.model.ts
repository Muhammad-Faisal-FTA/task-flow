// models/cdfSettings.model.ts

import mongoose, {
  Schema,
  model,
  models,
  Model,
} from "mongoose";
import type { ICdfSettings } from "@/types/cdf";

const CdfSettingsSchema = new Schema<ICdfSettings>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      unique:   true,        // one settings doc per user
      index:    true,
    },
    enabled: {
      type:    Boolean,
      default: false,        // CDF off by default
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const CdfSettingsModel: Model<ICdfSettings> =
  models.CdfSettings ??
  model<ICdfSettings>("CdfSettings", CdfSettingsSchema);