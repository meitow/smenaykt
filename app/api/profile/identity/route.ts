import { NextRequest, NextResponse } from "next/server";
import { getIdentityStatusForPhone, submitIdentityDocument } from "@/lib/identity-documents";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const phone = normalizeRuPhone(String(formData.get("phone") ?? "").trim());
    const consent = String(formData.get("consent") ?? "") === "true";
    const file = formData.get("file");

    if (!phone || !isValidRuPhone(phone)) {
      return NextResponse.json({ error: "Укажите телефон в профиле" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Выберите файл" }, { status: 400 });
    }

    const status = await submitIdentityDocument({ phone, file, consent });
    return NextResponse.json(status);
  } catch (error) {
    if (error instanceof Error) {
      const map: Record<string, { message: string; status: number }> = {
        CONSENT_REQUIRED: { message: "Подтвердите согласие на обработку данных", status: 400 },
        FILE_REQUIRED: { message: "Выберите файл", status: 400 },
        FILE_TOO_LARGE: { message: "Файл больше 5 МБ", status: 400 },
        FILE_TYPE: { message: "Формат: JPG, PNG, WebP или PDF", status: 400 },
        PENDING_EXISTS: { message: "Документ уже на проверке", status: 409 },
        ALREADY_VERIFIED: { message: "Личность уже подтверждена", status: 409 },
        BANNED: { message: "Номер заблокирован", status: 403 },
      };
      const mapped = map[error.message];
      if (mapped) {
        return NextResponse.json({ error: mapped.message }, { status: mapped.status });
      }
    }

    console.error("POST /api/profile/identity", error);
    return NextResponse.json({ error: "Не удалось отправить документ" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const phone = normalizeRuPhone(
    request.headers.get("x-user-phone") ?? request.nextUrl.searchParams.get("phone") ?? ""
  );
  if (!phone || !isValidRuPhone(phone)) {
    return NextResponse.json({ error: "Укажите телефон в профиле" }, { status: 400 });
  }

  try {
    const status = await getIdentityStatusForPhone(phone);
    return NextResponse.json(status);
  } catch (error) {
    console.error("GET /api/profile/identity", error);
    return NextResponse.json({ error: "Не удалось загрузить статус" }, { status: 500 });
  }
}
