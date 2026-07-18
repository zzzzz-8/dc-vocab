import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const userId = token ? verifyToken(token)?.userId : null;

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const search = searchParams.get('search');

    const where: any = { isActive: true };
    if (level) where.level = level;
    if (search) where.name = { contains: search };

    const wordBooks = await prisma.wordBook.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // If user is logged in, get their progress
    let userProgress: any[] = [];
    if (userId) {
      userProgress = await prisma.userWordBook.findMany({
        where: { userId },
        select: { wordBookId: true, progress: true },
      });
    }

    const progressMap = new Map(userProgress.map((p) => [p.wordBookId, p.progress]));

    const data = wordBooks.map((book) => ({
      ...book,
      progress: progressMap.get(book.id) || 0,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching word books:', error);
    return NextResponse.json({ success: false, error: '获取词书列表失败' }, { status: 500 });
  }
}
