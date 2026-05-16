import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Owner from '@/models/Owner';

// PUT update owner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const owner = await Owner.findByIdAndUpdate(
      id,
      { name: body.name?.trim(), phone: body.phone?.trim() },
      { new: true, runValidators: true }
    ).lean();
    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }
    return NextResponse.json(owner);
  } catch (error) {
    console.error('PUT /api/owners/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update owner' }, { status: 500 });
  }
}

// DELETE owner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const owner = await Owner.findByIdAndDelete(id);
    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Owner deleted' });
  } catch (error) {
    console.error('DELETE /api/owners/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete owner' }, { status: 500 });
  }
}
