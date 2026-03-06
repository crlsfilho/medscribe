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

    // Validate file size (max 50MB) and type
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo: 50MB" },
        { status: 400 }
      );
    }

    const ALLOWED_AUDIO_TYPES = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg", "audio/wav"];
    const fileType = audioFile.type || "audio/webm";
    if (!ALLOWED_AUDIO_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Apenas áudio." },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob with private access
    const ALLOWED_EXTENSIONS = ["webm", "mp4", "mp3", "ogg", "wav"];
    const ext = audioFile.name.split(".").pop()?.toLowerCase() || "webm";
    const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : "webm";
    const filename = `audio/${visitId}-${Date.now()}.${safeExt}`;

    const blob = await put(filename, audioFile, {
      access: "public", // TODO: migrate to signed URLs when Vercel Blob supports private reads
      contentType: fileType,
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
