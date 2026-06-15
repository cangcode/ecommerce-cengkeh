import { NextResponse } from "next/server";
import { createProduct, updateProduct } from "@/db/data/products/product.actions";
import axios from "axios";
import { products } from "@/db/schema";
import { db } from "@/index";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createProduct(body);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Create Product Error :", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "gagal membuat produk. Pastikan data sudah benar dan coba lagi.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { slug, ...data } = body;

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Slug produk diperlukan." },
        { status: 400 },
      );
    }

    const updated = await updateProduct(slug, data);

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Produk tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Produk berhasil diperbarui!", data: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update Product Error :", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal memperbarui produk. Pastikan data sudah benar dan coba lagi.",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const productsData = await db.select().from(products);
    return NextResponse.json(
      { success: true, data: productsData },
      { status: 200 },
    );
  } catch (error) {
    // Membantu kamu melihat log error aslinya di terminal backend jika API luar bermasalah
    if (axios.isAxiosError(error)) {
      console.error("Axios Error:", error.response?.data || error.message);
    } else if (error instanceof Error) {
      console.error("General Error:", error.message);
    } else {
      console.error("Unknown Error:", error);
    }

    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
