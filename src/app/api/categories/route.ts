import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';

// Default categories to seed on first load
const DEFAULT_CATEGORIES = {
  expense: ['Feed', 'Medicine', 'Labor', 'Transport', 'Veterinary', 'Maintenance', 'Electricity', 'Water', 'Other'],
  income: ['Cow Sale', 'Milk Sale', 'Manure Sale', 'Other'],
  investment: ['Cow Shed Construction', 'Land Purchase', 'Farm Equipment', 'Vehicle', 'Other Fixed Asset'],
};

// GET all categories (seeds defaults if empty)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Check if categories exist, seed defaults if empty
    const count = await Category.countDocuments();
    if (count === 0) {
      const toInsert = [
        ...DEFAULT_CATEGORIES.expense.map((name) => ({ name, type: 'expense' as const })),
        ...DEFAULT_CATEGORIES.income.map((name) => ({ name, type: 'income' as const })),
        ...DEFAULT_CATEGORIES.investment.map((name) => ({ name, type: 'investment' as const })),
      ];
      await Category.insertMany(toInsert);
    }

    const filter = type ? { type: type as 'income' | 'expense' | 'investment' } : {};
    const categories = await Category.find(filter).sort({ type: 1, name: 1 }).lean();

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST create a new category
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    if (!body.name || !body.type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const category = await Category.create({
      name: body.name.trim(),
      type: body.type,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('POST /api/categories error:', error);
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
