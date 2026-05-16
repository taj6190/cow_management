import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/db';
import Cow from '@/models/Cow';

// GET single cow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const cow = await Cow.findById(id).lean();
    if (!cow) {
      return NextResponse.json({ error: 'Cow not found' }, { status: 404 });
    }
    return NextResponse.json(cow);
  } catch (error) {
    console.error('GET /api/cows/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch cow' }, { status: 500 });
  }
}

// PUT update cow
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const token = await getToken({ req: request });
    if (token?.name) {
      body.updatedByName = token.name;
    }

    const cow = await Cow.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
    if (!cow) {
      return NextResponse.json({ error: 'Cow not found' }, { status: 404 });
    }
    return NextResponse.json(cow);
  } catch (error) {
    console.error('PUT /api/cows/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update cow' }, { status: 500 });
  }
}

// DELETE cow
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const cow = await Cow.findByIdAndDelete(id);
    if (!cow) {
      return NextResponse.json({ error: 'Cow not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Cow deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/cows/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete cow' }, { status: 500 });
  }
}
