import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

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

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const ext = audioFile.name.split(".").pop() || "webm";
    const filename = `${uuidv4()}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Write file to disk
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update visit with audio URL
    const audioUrl = `/uploads/${filename}`;
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
