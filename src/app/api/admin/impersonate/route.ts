import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Only the super-admin can use this route
  // We check the original session email (which we keep in the token/session if possible)
  // But here, getServerSession will return the impersonated session if already impersonating.
  // So we need to check session.user.impersonatedFromEmail OR its actual email if not impersonating.
  
  const originalEmail = session?.user?.impersonatedFromEmail || session?.user?.email;
  
  if (originalEmail !== "carlos@worldpackers.com") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const stop = searchParams.get("stop") === "true";

  const response = NextResponse.redirect(new URL("/dashboard", request.url));

  if (stop) {
    response.cookies.delete("impersonate_user_id");
  } else if (userId) {
    // Set cookie for 8 hours (same as session maxAge)
    response.cookies.set("impersonate_user_id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60,
      path: "/",
    });
  }

  return response;
}
