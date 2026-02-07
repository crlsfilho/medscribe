import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { path: pathParts } = await params;
    const filename = pathParts.join("/");

    // Security: prevent directory traversal
    if (filename.includes("..")) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const filepath = path.join(process.cwd(), "uploads", filename);
    const file = await readFile(filepath);

    // Determine content type based on extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes: Record<string, string> = {
      ".webm": "audio/webm",
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".m4a": "audio/m4a",
      ".ogg": "audio/ogg",
    };

    const contentType = contentTypes[ext] || "application/octet-stream";

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Erro ao servir arquivo:", error);
    return NextResponse.json(
      { error: "Arquivo não encontrado" },
      { status: 404 }
    );
  }
}
