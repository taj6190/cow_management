import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Cow from '@/models/Cow';
import Transaction from '@/models/Transaction';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'monthly';
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = searchParams.get('month') !== null
      ? parseInt(searchParams.get('month')!)
      : new Date().getMonth();
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    // Flexible filters
    const categoriesParam = searchParams.get('categories'); // comma-separated category names
    const typesParam = searchParams.get('types'); // comma-separated types: income,expense,investment

    if (type === 'monthly') {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

      // Get all transactions for the month
      const transactions = await Transaction.find({
        date: { $gte: monthStart, $lte: monthEnd },
      })
        .populate('cowIds', 'tag name')
        .sort({ date: -1 })
        .lean();

      // Aggregate by category
      const categoryBreakdown = await Transaction.aggregate([
        { $match: { date: { $gte: monthStart, $lte: monthEnd } } },
        {
          $group: {
            _id: { type: '$type', category: '$category' },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.type': 1, total: -1 } },
      ]);

      const incomeTotal = await Transaction.aggregate([
        { $match: { type: 'income', date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const expenseTotal = await Transaction.aggregate([
        { $match: { type: 'expense', date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const investmentTotal = await Transaction.aggregate([
        { $match: { type: 'investment', date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      // Active cows during this period
      const activeCowsCount = await Cow.countDocuments({
        purchaseDate: { $lte: monthEnd },
        $or: [
          { status: 'active' },
          { status: 'sold', sellDate: { $gte: monthStart } },
        ],
      });

      // Average cost per cow
      const sharedExpenses = await Transaction.aggregate([
        {
          $match: {
            type: 'expense',
            isShared: true,
            date: { $gte: monthStart, $lte: monthEnd },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const avgCostPerCow = activeCowsCount > 0
        ? Math.round((sharedExpenses[0]?.total || 0) / activeCowsCount)
        : 0;

      // Daily breakdown
      const dailyBreakdown = await Transaction.aggregate([
        { $match: { date: { $gte: monthStart, $lte: monthEnd } } },
        {
          $group: {
            _id: {
              day: { $dayOfMonth: '$date' },
              type: '$type',
            },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.day': 1 } },
      ]);

      return NextResponse.json({
        type: 'monthly',
        period: { year, month },
        transactions,
        categoryBreakdown: categoryBreakdown.map((c) => ({
          type: c._id.type,
          category: c._id.category,
          total: c.total,
          count: c.count,
        })),
        summary: {
          totalIncome: incomeTotal[0]?.total || 0,
          totalExpense: expenseTotal[0]?.total || 0,
          totalInvestment: investmentTotal[0]?.total || 0,
          profit: (incomeTotal[0]?.total || 0) - (expenseTotal[0]?.total || 0),
          activeCowsCount,
          avgCostPerCow,
          totalSharedExpenses: sharedExpenses[0]?.total || 0,
        },
        dailyBreakdown: dailyBreakdown.map((d) => ({
          day: d._id.day,
          type: d._id.type,
          total: d.total,
        })),
      });
    }

    if (type === 'cow-cost') {
      // Per-cow cost analysis
      const cows = await Cow.find().sort({ status: 1, tag: 1 }).lean();

      const cowCosts = await Promise.all(
        cows.map(async (cow) => {
          // Individual expenses for this cow (share = amount / cowIds.length)
          const individualExpenses = await Transaction.aggregate([
            { $match: { type: 'expense', cowIds: cow._id } },
            { 
              $project: { 
                share: { 
                  $cond: [
                    { $gt: [{ $size: { $ifNull: ['$cowIds', []] } }, 0] },
                    { $divide: ['$amount', { $size: { $ifNull: ['$cowIds', []] } }] },
                    '$amount'
                  ] 
                } 
              } 
            },
            { $group: { _id: null, total: { $sum: '$share' } } },
          ]);

          // Calculate shared cost: for each month the cow was active,
          // get the shared expense / active cows
          const purchaseDate = new Date(cow.purchaseDate);
          const endDate = cow.status === 'sold' && cow.sellDate
            ? new Date(cow.sellDate)
            : new Date();

          let totalSharedCost = 0;
          let monthCount = 0;

          const current = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), 1);
          while (current <= endDate) {
            const mStart = new Date(current);
            const mEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59);

            const sharedExp = await Transaction.aggregate([
              {
                $match: {
                  type: 'expense',
                  isShared: true,
                  date: { $gte: mStart, $lte: mEnd },
                },
              },
              { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);

            const activeCowsInMonth = await Cow.countDocuments({
              purchaseDate: { $lte: mEnd },
              $or: [
                { status: 'active' },
                { status: 'sold', sellDate: { $gte: mStart } },
              ],
            });

            if (activeCowsInMonth > 0 && sharedExp[0]?.total) {
              totalSharedCost += Math.round(sharedExp[0].total / activeCowsInMonth);
            }
            monthCount++;
            current.setMonth(current.getMonth() + 1);
          }

          const totalCost = cow.purchasePrice +
            (individualExpenses[0]?.total || 0) +
            totalSharedCost;

          const profitLoss = cow.status === 'sold' && cow.sellPrice
            ? cow.sellPrice - totalCost
            : null;

          return {
            _id: cow._id,
            tag: cow.tag,
            name: cow.name,
            image: cow.image,
            status: cow.status,
            purchasePrice: cow.purchasePrice,
            sellPrice: cow.sellPrice || null,
            individualExpenses: individualExpenses[0]?.total || 0,
            sharedExpenses: totalSharedCost,
            totalCost,
            monthsActive: monthCount,
            avgMonthlyCost: monthCount > 0 ? Math.round(totalSharedCost / monthCount) : 0,
            profitLoss,
            suggestedSellPrice: Math.round(totalCost * 1.15), // 15% margin
          };
        })
      );

      return NextResponse.json({
        type: 'cow-cost',
        cows: cowCosts,
      });
    }

    if (type === 'category' || type === 'custom') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matchFilter: any = {};

      // Date filter
      if (startDate && endDate) {
        matchFilter.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate + 'T23:59:59.999Z'),
        };
      } else if (startDate) {
        matchFilter.date = { $gte: new Date(startDate) };
      } else if (endDate) {
        matchFilter.date = { $lte: new Date(endDate + 'T23:59:59.999Z') };
      }

      // Type filter (comma-separated)
      if (typesParam) {
        const typesArray = typesParam.split(',').filter(Boolean);
        if (typesArray.length > 0 && typesArray.length < 3) {
          matchFilter.type = { $in: typesArray };
        }
      }

      // Category filter (comma-separated)
      if (categoriesParam) {
        const categoriesArray = categoriesParam.split(',').filter(Boolean);
        if (categoriesArray.length > 0) {
          matchFilter.category = { $in: categoriesArray };
        }
      }

      // Category breakdown aggregation
      const categoryBreakdown = await Transaction.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: { type: '$type', category: '$category' },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]);

      // Summary totals with same filter
      const summaryAgg = await Transaction.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]);

      const summary = {
        totalIncome: 0,
        totalExpense: 0,
        totalInvestment: 0,
        totalTransactions: 0,
      };
      summaryAgg.forEach((s) => {
        if (s._id === 'income') summary.totalIncome = s.total;
        if (s._id === 'expense') summary.totalExpense = s.total;
        if (s._id === 'investment') summary.totalInvestment = s.total;
        summary.totalTransactions += s.count;
      });

      // Fetch individual transactions for the detailed view
      const transactions = await Transaction.find(matchFilter)
        .populate('cowIds', 'tag name')
        .populate('paidBy', 'name')
        .sort({ date: -1 })
        .limit(500)
        .lean();

      return NextResponse.json({
        type: 'custom',
        categories: categoryBreakdown.map((c) => ({
          type: c._id.type,
          category: c._id.category,
          total: c.total,
          count: c.count,
        })),
        summary,
        transactions,
      });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error) {
    console.error('GET /api/reports error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
