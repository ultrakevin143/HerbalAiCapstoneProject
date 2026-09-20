import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const backendApi = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
  if (request.headers.get('origin') !== new URL(backendApi).origin) {
    return NextResponse.json({ message: 'Invalid sign-in origin.' }, { status: 403 });
  }

  const form = await request.formData();
  const refreshToken = form.get('refreshToken');
  if (typeof refreshToken !== 'string' || !refreshToken) {
    return NextResponse.json({ message: 'Missing sign-in token.' }, { status: 400 });
  }

  const verification = await fetch(`${backendApi}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });
  if (!verification.ok) {
    return NextResponse.json({ message: 'Google sign-in session could not be verified.' }, { status: 401 });
  }

  const result = await verification.json();
  const tokens = result.data as { accessToken?: string; refreshToken?: string } | undefined;
  if (!tokens?.accessToken || !tokens.refreshToken) {
    return NextResponse.json({ message: 'Google sign-in returned an incomplete session.' }, { status: 502 });
  }

  const response = NextResponse.redirect(new URL('/auth/google/success', request.url), 303);
  const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' };
  response.cookies.set('accessToken', tokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 });
  response.cookies.set('refreshToken', tokens.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
