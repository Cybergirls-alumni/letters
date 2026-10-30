import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import path from "path";
import fs from "fs/promises";
import { rateLimit } from "@/lib/rate-limit";

const ALLOWED_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "upload", 20, 60 * 60 * 1000);
  if (limited) return limited;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
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

  // file.type is client-controlled — .docx is a ZIP, so check the PK\x03\x04 magic bytes too
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const isZip =
    head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04;
  if (!isZip) {
    return NextResponse.json({ error: "Only .docx files are accepted" }, { status: 400 });
  }

  // Use Vercel Blob in production, local filesystem in development
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}.docx`;
    const blob = await put(uniqueName, file, { access: "public" });
    return NextResponse.json({ url: blob.url }, { status: 201 });
  }

  // Local dev fallback
  const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomUUID()}.docx`;
  const filepath = path.join(UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);
  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
}
