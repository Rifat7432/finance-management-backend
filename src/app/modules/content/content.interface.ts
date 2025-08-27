import mongoose, { Document } from "mongoose";

export interface IContent extends Document {
  campaignName: string;
  audience: 'Public' | 'Private' | 'Internal';
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  createdBy: mongoose.Types.ObjectId;
  status: 'Draft' | 'Published' | 'Archived';
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}
