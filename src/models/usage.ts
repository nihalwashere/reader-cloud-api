import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IUsageLog extends Document {
  apiKeyId: Types.ObjectId;
  url: string;
  duration: number;
  status: "success" | "error";
  cached: boolean;
  error?: string;
  createdAt: Date;
}

const usageLogSchema = new Schema<IUsageLog>({
  apiKeyId: { type: Schema.Types.ObjectId, ref: "ApiKey", required: true },
  url: { type: String, required: true },
  duration: { type: Number, required: true },
  status: { type: String, enum: ["success", "error"], required: true },
  cached: { type: Boolean, default: false },
  error: { type: String },
  createdAt: { type: Date, default: Date.now },
});

usageLogSchema.index({ apiKeyId: 1, createdAt: -1 });

export const UsageLog = mongoose.model<IUsageLog>("UsageLog", usageLogSchema);
