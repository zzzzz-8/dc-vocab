import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // vowel, consonant

    const where: any = {};
    if (type) where.type = type;

    const symbols = await prisma.phoneticSymbol.findMany({
      where,
      orderBy: { symbol: 'asc' },
    });

    return NextResponse.json({ success: true, data: symbols });
  } catch (error) {
    console.error('Error fetching phonetics:', error);
    return NextResponse.json({ success: false, error: '获取音标失败' }, { status: 500 });
  }
}
