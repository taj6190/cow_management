import dbConnect from '@/lib/db';
import Cow from '@/models/Cow';
import '@/models/Owner'; // Ensure Owner schema is registered for populate
import Transaction from '@/models/Transaction';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Cow counts
    const activeCows = await Cow.countDocuments({ status: 'active' });
    const soldCows = await Cow.countDocuments({ status: 'sold' });
    const totalCows = activeCows + soldCows;

    // This month's income & expenses
    const monthlyIncome = await Transaction.aggregate([
      {
        $match: {
          type: 'income',
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const monthlyExpense = await Transaction.aggregate([
      {
        $match: {
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const monthlyInvestment = await Transaction.aggregate([
      {
        $match: {
          type: 'investment',
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Average cost per cow this month (shared expenses / active cows)
    const sharedExpenses = await Transaction.aggregate([
      {
        $match: {
          type: 'expense',
          isShared: true,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const avgCostPerCow = activeCows > 0
      ? Math.round((sharedExpenses[0]?.total || 0) / activeCows)
      : 0;

    // Recent transactions
    const recentTransactions = await Transaction.find()
      .populate('cowIds', 'tag name')
      .populate('paidBy', 'name')
      .sort({ date: -1, createdAt: -1 })
      .limit(8)
      .lean();

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const income = await Transaction.aggregate([
        { $match: { type: 'income', date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const expense = await Transaction.aggregate([
        { $match: { type: 'expense', date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      monthlyTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        income: income[0]?.total || 0,
        expense: expense[0]?.total || 0,
      });
    }

    // Expense category breakdown this month
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    return NextResponse.json({
      stats: {
        activeCows,
        soldCows,
        totalCows,
        monthlyIncome: monthlyIncome[0]?.total || 0,
        monthlyExpense: monthlyExpense[0]?.total || 0,
        monthlyInvestment: monthlyInvestment[0]?.total || 0,
        avgCostPerCow,
        profit: (monthlyIncome[0]?.total || 0) - (monthlyExpense[0]?.total || 0),
      },
      recentTransactions,
      monthlyTrend,
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c._id,
        total: c.total,
      })),
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
