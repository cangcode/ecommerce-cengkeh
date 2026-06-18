import midtransClient from "midtrans-client";

const serverKey = process.env.MIDTRANS_SERVER_KEY;
const clientKey = process.env.MIDTRANS_CLIENT_KEY;

if (!serverKey || !clientKey) {
  console.warn(
    "⚠️ Midtrans keys tidak ditemukan di .env. Payment gateway TIDAK akan berfungsi.",
  );
}

export const snap = new midtransClient.Snap({
  isProduction: false, // ⚠️ ganti ke true saat production
  serverKey: serverKey ?? "",
  clientKey: clientKey ?? "",
});

export const coreApi = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: serverKey ?? "",
  clientKey: clientKey ?? "",
});

export { clientKey };
