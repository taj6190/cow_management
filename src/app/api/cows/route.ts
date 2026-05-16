import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/db';
import Cow from '@/models/Cow';

// GET all cows with optional filters
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { tag: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Cow.countDocuments(filter);
    const cows = await Cow.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      cows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('GET /api/cows error:', error);
    return NextResponse.json({ error: 'Failed to fetch cows' }, { status: 500 });
  }
}

// POST create a new cow
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Add createdBy name
    const token = await getToken({ req: request });
    if (token?.name) {
      body.createdByName = token.name;
    }

    const cow = await Cow.create(body);
    return NextResponse.json(cow, { status: 201 });
  } catch (error) {
    console.error('POST /api/cows error:', error);
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json({ error: 'A cow with this tag already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create cow' }, { status: 500 });
  }
}
