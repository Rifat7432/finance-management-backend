import mongoose, { Schema } from 'mongoose';
import { IContent } from './content.interface';


const ContentSchema: Schema<IContent> = new Schema(
  {
    campaignName: {
      type: String,
      required: true,
      trim: true,
    },
    audience: {
      type: String,
      enum: ['Public', 'Private', 'Internal'],
      default: 'Public',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Archived'],
      default: 'Draft',
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Content = mongoose.model<IContent>('Content', ContentSchema);
