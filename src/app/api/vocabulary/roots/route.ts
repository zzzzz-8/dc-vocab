import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // prefix, suffix, root
    const search = searchParams.get('search');

    const where: any = {};
    if (type) where.type = type;
    if (search) where.root = { contains: search };

    const roots = await prisma.rootAffix.findMany({
      where,
      orderBy: { root: 'asc' },
    });

    return NextResponse.json({ success: true, data: roots });
  } catch (error) {
    console.error('Error fetching roots:', error);
    return NextResponse.json({ success: false, error: '获取词根词缀失败' }, { status: 500 });
  }
}
