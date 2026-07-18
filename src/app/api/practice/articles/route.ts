import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'reading';
    const level = searchParams.get('level');
    const page = parseInt(searchParams.get('page') || '1');

    const where: any = { articleType: type, isActive: true };
    if (level) where.level = level;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip: (page - 1) * 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: articles, total, page });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ success: false, error: '获取文章失败' }, { status: 500 });
  }
}
