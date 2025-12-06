import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Role } from "./generated/prisma/client";

export async function proxy(request: NextRequest) {
  if(request.nextUrl.pathname == "/") return NextResponse.next();
  const token = await getToken({ req: request, secret: process.env.SECRET });

  if (!token){
    if (request.nextUrl.pathname.startsWith("/table/")) return NextResponse.next();
    return NextResponse.redirect(new URL("/signin", request.url));
  }else if(request.nextUrl.pathname.startsWith("/table/") && request.nextUrl.pathname != "/table/create"){
    return NextResponse.redirect(new URL("/" + (token.role == Role.ADMIN? 'dashboard' : token.role == Role.KITCHEN_STAFF ? 'live' : 'cashier'), request.url));
  }

  // Check the role and redirect based on the role
  switch (token.role) {
    case Role.ADMIN:
      // Admin can access all routes
      break;
    case Role.CASHIER:
        // Allow cashier to access: cashier, table management, history, and reports
        // Deny access to user management
        if (request.nextUrl.pathname.startsWith("/dashboard/users")) {
          return NextResponse.redirect(new URL("/cashier", request.url));
        }
        const cashierAllowedPaths = ["/cashier", "/table", "/table/create", "/dashboard/history", "/dashboard/reports"];
        const isCashierPathAllowed = cashierAllowedPaths.some(path => 
          request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + "/")
        );
        if(!isCashierPathAllowed) return NextResponse.redirect(new URL("/cashier", request.url));
      break;
    case Role.KITCHEN_STAFF:
        // Kitchen staff can only access live orders
        if(request.nextUrl.pathname != "/live") return NextResponse.redirect(new URL("/live", request.url));
      break;
    default:
      // return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
    matcher: ['/((?!signin|api/auth|_next/static|_next/image|__nextjs_font|favicon.ico).*)']
}