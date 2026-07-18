import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const level = searchParams.get('level');

    const where: any = {};
    if (category) where.category = category;
    if (level) where.level = level;

    const points = await prisma.grammarPoint.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({ success: true, data: points });
  } catch (error) {
    console.error('Error fetching grammar:', error);
    return NextResponse.json({ success: false, error: '获取语法点失败' }, { status: 500 });
  }
}
