import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { issueSignedToken, presignUrl } from "@vercel/blob";

export async function GET(request: Request) {
    // Rate limit: 20 requests per minute per IP
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { success } = rateLimit(`portal:${ip}`, 20, 60_000);
    if (!success) {
        return NextResponse.json({ error: "Muitas requisições. Tente novamente em breve." }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

    try {
        const patient = await prisma.patient.findUnique({
            where: { shareToken: token },
            include: {
                visits: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        createdAt: true,
                        laymanSummary: true,
                        carePlan: true,
                        returnChecklist: true,
                        actionableItems: {
                            where: { status: 'completed' }
                        }
                    }
                }
            }
        });

        if (!patient) {
            return NextResponse.json({ error: "Invalid token" }, { status: 404 });
        }

        // Validate token expiration
        if (patient.shareTokenExpiresAt && new Date(patient.shareTokenExpiresAt) < new Date()) {
            return NextResponse.json(
                { error: "Token expirado. Solicite um novo link ao seu médico." },
                { status: 403 }
            );
        }

        // Check if verified via cookie
        const cookieStore = await cookies();
        const verifiedCookie = cookieStore.get(`portal_verified_${token}`);
        const isVerified = verifiedCookie?.value === "true";

        if (!isVerified) {
            // Minimization (LGPD): Return only name to greet the user
            return NextResponse.json({
                name: patient.name,
                requireVerification: true
            });
        }

        // Generate signed URLs for completed actionable documents (PDFs/Images)
        for (const visit of patient.visits) {
            for (const item of visit.actionableItems) {
                if (item.metadata) {
                    try {
                        const meta = JSON.parse(item.metadata);
                        if (meta.url && meta.url.startsWith("http")) {
                            const urlObj = new URL(meta.url);
                            const pathname = urlObj.pathname.replace(/^\//, "");

                            const signedToken = await issueSignedToken({
                                pathname,
                                operations: ["get"],
                                validUntil: Date.now() + 15 * 60 * 1000, // 15 mins
                            });

                            const { presignedUrl } = await presignUrl(signedToken, {
                                pathname,
                                operation: "get",
                                access: "private",
                                validUntil: Date.now() + 15 * 60 * 1000,
                            });

                            meta.url = presignedUrl;
                            item.metadata = JSON.stringify(meta);
                        }
                    } catch (e) {
                        console.error("Erro ao assinar URL de documento no portal:", e);
                    }
                }
            }
        }

        // Create audit log for portal view
        await prisma.auditLog.create({
            data: {
                userId: patient.userId,
                visitId: patient.visits[0]?.id || null,
                action: "portal_access",
                details: `Portal do paciente '${patient.name}' visualizado via link público após autenticação. IP: ${ip}`,
            }
        });

        return NextResponse.json(patient);
    } catch (error) {
        console.error("Error fetching portal data:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
