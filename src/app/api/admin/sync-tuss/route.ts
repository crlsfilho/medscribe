import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncTussCodes } from "@/lib/tuss-service";

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Optional: Check for admin role if applicable
    // if (session.user.role !== 'admin') ...

    try {
        const result = await syncTussCodes();
        return NextResponse.json(result);
    } catch (error) {
        console.error("TUSS Sync Error:", error);
        return NextResponse.json(
            { error: "Failed to sync TUSS codes" },
            { status: 500 }
        );
    }
}
