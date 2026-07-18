import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const wordBookId = searchParams.get('wordBookId');

    const where: any = {};
    if (level) where.level = level;
    if (wordBookId) where.wordBookId = wordBookId;

    const coursewares = await prisma.courseware.findMany({
      where,
      include: { wordBook: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: coursewares });
  } catch (error) {
    console.error('Error fetching courseware:', error);
    return NextResponse.json({ success: false, error: '获取课件失败' }, { status: 500 });
  }
}
