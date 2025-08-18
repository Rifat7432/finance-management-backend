import { Document } from "mongoose";

export interface IDateNight extends Document {
  plan: string;
  budget: number;
  repeatEvery: "Daily" | "Weekly" | "Monthly" | "Yearly";
  date?: Date;
  time?: string;
  location?: string;
  enableNotification: boolean;
  createdAt: Date;
}