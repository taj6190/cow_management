import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Cow from '@/models/Cow';
import Transaction from '@/models/Transaction';

// GET - Export full database as JSON
export async function GET() {
  try {
    await dbConnect();

    const cows = await Cow.find().lean();
    const transactions = await Transaction.find().lean();

    const backup = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      data: {
        cows,
        transactions,
      },
      counts: {
        cows: cows.length,
        transactions: transactions.length,
      },
    };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="cowfarm-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('GET /api/backup error:', error);
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}

// POST - Restore database from backup JSON
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    if (!body.data || !body.data.cows || !body.data.transactions) {
      return NextResponse.json(
        { error: 'Invalid backup file format' },
        { status: 400 }
      );
    }

    // Clear existing data
    await Cow.deleteMany({});
    await Transaction.deleteMany({});

    // Restore data
    if (body.data.cows.length > 0) {
      await Cow.insertMany(body.data.cows);
    }
    if (body.data.transactions.length > 0) {
      await Transaction.insertMany(body.data.transactions);
    }

    return NextResponse.json({
      message: 'Database restored successfully',
      counts: {
        cows: body.data.cows.length,
        transactions: body.data.transactions.length,
      },
    });
  } catch (error) {
    console.error('POST /api/backup error:', error);
    return NextResponse.json({ error: 'Failed to restore backup' }, { status: 500 });
  }
}
