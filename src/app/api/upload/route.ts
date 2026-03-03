import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const visitId = formData.get("visitId") as string | null;

    if (!audioFile || !visitId) {
      return NextResponse.json(
        { error: "Áudio e ID da consulta são obrigatórios" },
        { status: 400 }
      );
    }

    // Verify visit belongs to user
    const visit = await prisma.visit.findFirst({
      where: {
        id: visitId,
        userId: session.user.id,
      },
    });

    if (!visit) {
      return NextResponse.json(
        { error: "Consulta não encontrada" },
        { status: 404 }
      );
    }

    // Upload to Vercel Blob
    const ext = audioFile.name.split(".").pop() || "webm";
    const filename = `audio/${visitId}-${Date.now()}.${ext}`;

    const blob = await put(filename, audioFile, {
      access: "public",
      contentType: audioFile.type || "audio/webm",
    });

    // Update visit with audio URL
    const audioUrl = blob.url;
    await prisma.visit.update({
      where: { id: visitId },
      data: { audioUrl },
    });

    return NextResponse.json({ audioUrl });
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload do áudio" },
      { status: 500 }
    );
  }
}
