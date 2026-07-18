import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const mastered = searchParams.get('mastered');
    const stageFilter = searchParams.get('stage');
    const sort = searchParams.get('sort') || 'newest';

    const where: any = { userId: payload.userId };
    if (mastered === 'true') where.stage = { gte: 7 };
    if (mastered === 'false') where.stage = { lt: 7 };
    if (stageFilter !== null && stageFilter !== '') {
      where.stage = parseInt(stageFilter);
    }

    let orderBy: any = { updatedAt: 'desc' as const };
    switch (sort) {
      case 'newest': orderBy = { updatedAt: 'desc' as const }; break;
      case 'oldest': orderBy = { updatedAt: 'asc' as const }; break;
      case 'priority': orderBy = { nextReviewAt: 'asc' as const }; break;
      case 'alpha': orderBy = undefined; break;
    }

    const [records, total] = await Promise.all([
      prisma.userWord.findMany({
        where,
        include: { word: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
      }),
      prisma.userWord.count({ where }),
    ]);

    let sortedRecords = records;
    if (sort === 'alpha') {
      sortedRecords = records.sort((a, b) =>
        (a.word?.word || '').localeCompare(b.word?.word || '')
      );
    }

    return NextResponse.json({
      success: true,
      data: sortedRecords,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching learned words:', error);
    return NextResponse.json({ success: false, error: '获取已学词失败' }, { status: 500 });
  }
}
