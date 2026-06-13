import "dotenv/config";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Handle request GET (Mengambil data kecamatan berdasarkan ID kabupaten)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ district_id: string }> },
) {
  try {
    const { district_id } = await params;
    const districtId = district_id?.trim();

    if (!districtId || !/^\d+(?:\.\d+)*$/.test(districtId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Parameter district_id tidak valid",
        },
        { status: 400 },
      );
    }

    const apiKey = process.env.BINDERBYTE_API_KEY;

    // const response = await axios.get(
    //   `https://api.binderbyte.com/wilayah/kelurahan?api_key=${apiKey}&id_kecamatan=${Number(district_id)}`,
    // );
    const response = await axios.get(
      `https://api.binderbyte.com/wilayah/kelurahan`,
      {
        params: {
          api_key: apiKey,
          id_kecamatan: districtId,
        },
      },
    );

    const villages = response.data;

    return NextResponse.json(
      { success: true, data: villages },
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

// Handle request POST (Contoh jika ingin menambah kecamatan baru ke kabupaten ini)
export async function POST(
  request: Request,
  { params }: { params: { regencyId: string } },
) {
  try {
    const { regencyId } = params;

    // Ambil data dari body request
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Nama kecamatan wajib diisi" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Sukses menambahkan kecamatan baru di kabupaten ${regencyId}`,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan data" },
      { status: 500 },
    );
  }
}
