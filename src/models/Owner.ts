import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOwner extends Document {
  name: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OwnerSchema = new Schema<IOwner>(
  {
    name: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Owner: Model<IOwner> =
  mongoose.models.Owner || mongoose.model<IOwner>('Owner', OwnerSchema);

export default Owner;
