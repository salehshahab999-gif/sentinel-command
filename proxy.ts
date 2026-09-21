import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/TERANSLET") {
    const url = request.nextUrl.clone();
    url.pathname = "/translet";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/TERANSLET"],
};
