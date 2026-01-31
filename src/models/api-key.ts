import mongoose, { Schema, type Document } from "mongoose";

export interface IApiKey extends Document {
  key: string;
  name: string;
  active: boolean;
  rateLimit: number;
  createdAt: Date;
}

const apiKeySchema = new Schema<IApiKey>({
  key: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  active: { type: Boolean, default: true },
  rateLimit: { type: Number, default: 60 },
  createdAt: { type: Date, default: Date.now },
});

export const ApiKey = mongoose.model<IApiKey>("ApiKey", apiKeySchema);
