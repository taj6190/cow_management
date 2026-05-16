import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  type: 'income' | 'expense' | 'investment';
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense', 'investment'],
      required: [true, 'Category type is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: no duplicate names within the same type
CategorySchema.index({ name: 1, type: 1 }, { unique: true });

const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
