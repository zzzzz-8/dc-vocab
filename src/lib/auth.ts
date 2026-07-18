import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'duo-vocab-secret-key-2024';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: string;
  username: string;
}

/**
 * 生成JWT Token
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 验证JWT Token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * 从请求中获取用户ID
 */
export async function getUserIdFromRequest(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    const payload = verifyToken(token);
    return payload?.userId || null;
  } catch {
    return null;
  }
}

/**
 * 从请求头获取用户ID (用于API路由)
 */
export function getUserIdFromHeader(request: Request): string | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    return payload?.userId || null;
  } catch {
    return null;
  }
}

/**
 * 需要认证的API响应包装
 */
export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: '请先登录' },
    { status: 401 }
  );
}

/**
 * 验证请求是否已认证
 */
export function requireAuth(payload: JWTPayload | null): { authorized: boolean; response?: NextResponse } {
  if (!payload) {
    return { authorized: false, response: unauthorizedResponse() };
  }
  return { authorized: true };
}
