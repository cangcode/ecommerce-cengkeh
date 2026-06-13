import "dotenv/config";
import { NextResponse } from "next/server";
import axios from "axios";

// Handle request GET (Mengambil data kecamatan berdasarkan ID kabupaten)
export async function GET() {
  try {
    // 1. Ambil API Key dari .env dengan aman
    const apiKey = process.env.BINDERBYTE_API_KEY;
    const idKabupaten = "73.16"; // ID Kabupaten Enrekang

    // 2. Tembak API Pihak Ketiga menggunakan Axios
    const response = await axios.get(
      `https://api.binderbyte.com/wilayah/kecamatan?api_key=${apiKey}&id_kabupaten=${idKabupaten}`,
    );

    // 3. Ambil data aslinya menggunakan response.data
    const enrekangDistricts = response.data;

    // 4. Kembalikan data ke frontend
    return NextResponse.json(
      { success: true, data: enrekangDistricts },
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
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan data" },
      { status: 500 },
    );
  }
}
