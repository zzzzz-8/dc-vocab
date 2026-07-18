import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const wordBook = await prisma.wordBook.findUnique({
      where: { id },
      include: { words: { take: 20, orderBy: { id: 'asc' } } },
    });

    if (!wordBook) {
      return NextResponse.json({ success: false, error: '词书不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: wordBook });
  } catch (error) {
    console.error('Error fetching word book:', error);
    return NextResponse.json({ success: false, error: '获取词书详情失败' }, { status: 500 });
  }
}
