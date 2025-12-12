import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  // Allow large bodies for upload endpoint
  if (request.nextUrl.pathname === '/api/projects/upload') {
    const response = await updateSession(request)
    response.headers.set('x-body-size-limit', '52428800') // 50MB in bytes
    return response
  }
  
  return await updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}