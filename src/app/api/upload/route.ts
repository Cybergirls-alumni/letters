import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import path from "path";
import fs from "fs/promises";

const ALLOWED_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only .docx files are accepted" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File must be under 10MB" }, { status: 400 });
  }

  // Use Vercel Blob in production, local filesystem in development
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(file.name, file, { access: "public" });
    return NextResponse.json({ url: blob.url }, { status: 201 });
  }

  // Local dev fallback
  const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const ext = file.name.split(".").pop() ?? "bin";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);
  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
}
