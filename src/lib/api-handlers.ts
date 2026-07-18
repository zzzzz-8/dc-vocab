import { NextResponse } from 'next/server';
import { verifyToken } from './auth';

/**
 * 通用成功响应
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * 通用错误响应
 */
export function errorResponse(error: string, status: number = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * 从请求中提取认证信息
 */
export function getAuthFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
}

/**
 * 需要认证的路由守卫
 */
export function withAuth(request: Request) {
  const user = getAuthFromRequest(request);
  if (!user) {
    return { user: null as null, response: errorResponse('请先登录', 401) };
  }
  return { user, response: null as null };
}
