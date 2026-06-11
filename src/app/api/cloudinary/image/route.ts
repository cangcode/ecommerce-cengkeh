import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function configureCloudinary() {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return {
      ok: false as const,
      error:
        "Konfigurasi Cloudinary belum lengkap. Pastikan CLOUDINARY_CLOUD_NAME (atau NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME), CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET terisi.",
    };
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return { ok: true as const };
}

export async function DELETE(req: Request) {
  try {
    const cloudinaryConfig = configureCloudinary();
    if (!cloudinaryConfig.ok) {
      return NextResponse.json(
        { error: cloudinaryConfig.error },
        { status: 500 },
      );
    }

    const { publicId } = await req.json();

    if (!publicId || typeof publicId !== "string") {
      return NextResponse.json(
        { error: "publicId tidak valid" },
        { status: 400 },
      );
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });

    if (result.result !== "ok") {
      return NextResponse.json(
        {
          error: "Cloudinary gagal menghapus gambar",
          cloudinaryResult: result.result,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan server";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
