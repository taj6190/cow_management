import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICow extends Document {
  tag: string;
  name: string;
  breed: string;
  dateOfBirth?: Date;
  purchaseDate: Date;
  purchasePrice: number;
  weight?: number;
  image?: string;
  status: 'active' | 'sold';
  sellDate?: Date;
  sellPrice?: number;
  buyerName?: string;
  buyerPhone?: string;
  notes?: string;
  createdByName?: string;
  updatedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CowSchema = new Schema<ICow>(
  {
    tag: {
      type: String,
      required: [true, 'Cow tag/ID is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    breed: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: Date,
    },
    purchaseDate: {
      type: Date,
      required: [true, 'Purchase date is required'],
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: 0,
    },
    weight: {
      type: Number,
      min: 0,
    },
    image: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'sold'],
      default: 'active',
    },
    sellDate: {
      type: Date,
    },
    sellPrice: {
      type: Number,
      min: 0,
    },
    buyerName: {
      type: String,
      trim: true,
    },
    buyerPhone: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdByName: {
      type: String,
      trim: true,
      default: '',
    },
    updatedByName: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Cow: Model<ICow> = mongoose.models.Cow || mongoose.model<ICow>('Cow', CowSchema);

export default Cow;
