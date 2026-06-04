import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { ensureUserProfile } from "@/lib/profile";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function avatarFileName(phone: string, ext: string) {
  const hash = createHash("sha256").update(phone).digest("hex").slice(0, 20);
  return `${hash}.${ext}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const phone = normalizeRuPhone(String(formData.get("phone") ?? "").trim());
    const file = formData.get("file");

    if (!phone || !isValidRuPhone(phone)) {
      return NextResponse.json({ error: "Укажите телефон в профиле" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Выберите фото" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Файл больше 2 МБ" }, { status: 400 });
    }

    const ext = ALLOWED.get(file.type);
    if (!ext) {
      return NextResponse.json({ error: "Формат: JPG, PNG или WebP" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(dir, { recursive: true });

    const filename = avatarFileName(phone, ext);
    const filepath = path.join(dir, filename);
    await writeFile(filepath, bytes);

    const avatarUrl = `/uploads/avatars/${filename}?v=${Date.now()}`;

    await ensureUserProfile(phone);
    await prisma.userProfile.update({
      where: { phone },
      data: { avatarUrl },
    });

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error("POST /api/profile/avatar", error);
    return NextResponse.json({ error: "Не удалось загрузить фото" }, { status: 500 });
  }
}
