import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/tools/assessment
 * 获取最新的测词结果
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const assessment = await prisma.vocabularyTest.findFirst({
      where: { userId: payload.userId },
      orderBy: { testedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json({ success: false, error: '获取测词结果失败' }, { status: 500 });
  }
}

/**
 * POST /api/tools/assessment
 * 保存测词结果
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { totalWords, knownWords, score, details } = await request.json();

    // 估算词汇量等级
    let level = 'L1';
    if (score >= 90) level = 'L10';
    else if (score >= 80) level = 'L8';
    else if (score >= 65) level = 'L6';
    else if (score >= 50) level = 'L4';
    else if (score >= 30) level = 'L2';

    // 估算词汇量（60题满分对应约12000词汇量）
    const vocabulary = Math.round((score / 60) * 12000);

    const assessment = await prisma.vocabularyTest.create({
      data: {
        userId: payload.userId,
        total: totalWords || 60,
        score: knownWords || score || 0,
        vocabulary,
        level,
        details: details ? JSON.stringify(details) : null,
      },
    });

    return NextResponse.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json({ success: false, error: '保存测词结果失败' }, { status: 500 });
  }
}
