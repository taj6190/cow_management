import mongoose, { Schema, Document, Model } from 'mongoose';

export type TransactionType = 'income' | 'expense' | 'investment';

export interface ITransaction extends Document {
  type: TransactionType;
  category: string;
  amount: number;
  date: Date;
  description: string;
  cowIds: mongoose.Types.ObjectId[];
  isShared: boolean;
  paidBy?: mongoose.Types.ObjectId;
  createdByName?: string;
  updatedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    type: {
      type: String,
      enum: ['income', 'expense', 'investment'],
      required: [true, 'Transaction type is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    cowIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Cow',
    }],
    isShared: {
      type: Boolean,
      default: true,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'Owner',
      default: null,
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

TransactionSchema.index({ date: -1 });
TransactionSchema.index({ type: 1, date: -1 });
TransactionSchema.index({ cowIds: 1 });
TransactionSchema.index({ paidBy: 1 });

if (mongoose.models.Transaction) {
  delete mongoose.models.Transaction;
}

const Transaction: Model<ITransaction> = mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
