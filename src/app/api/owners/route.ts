import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Owner from '@/models/Owner';

// GET all owners
export async function GET() {
  try {
    await dbConnect();
    const owners = await Owner.find().sort({ name: 1 }).lean();
    return NextResponse.json({ owners });
  } catch (error) {
    console.error('GET /api/owners error:', error);
    return NextResponse.json({ error: 'Failed to fetch owners' }, { status: 500 });
  }
}

// POST create owner
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const owner = await Owner.create({
      name: body.name.trim(),
      phone: body.phone?.trim() || '',
    });

    return NextResponse.json(owner, { status: 201 });
  } catch (error) {
    console.error('POST /api/owners error:', error);
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json({ error: 'Owner already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create owner' }, { status: 500 });
  }
}
