import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const difficulty = searchParams.get('difficulty');

    const where: any = { wordBookId: id };
    if (difficulty) where.difficulty = parseInt(difficulty);

    const [words, total] = await Promise.all([
      prisma.word.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'asc' },
      }),
      prisma.word.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: words,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching words:', error);
    return NextResponse.json({ success: false, error: '获取单词列表失败' }, { status: 500 });
  }
}
