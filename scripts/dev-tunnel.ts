/**
 * Dev tunnel via NGrok CLI (bukan library Node).
 *
 * Prasyarat:
 *   ngrok config add-authtoken <TOKEN>
 *
 * Usage:
 *   npm run dev:ngrok
 */

import { spawn } from "child_process";

const PORT = 3000;

async function main() {
  // 1. Jalankan ngrok di background
  console.log("🚇 Memulai Ngrok tunnel ke localhost:3000...\n");
  const ngrokProcess = spawn("ngrok", ["http", String(PORT), "--log=stdout"], {
    stdio: ["ignore", "pipe", "ignore"],
    shell: true,
  });

  // 2. Tunggu sampai tunnel ready, ambil URL
  const publicUrl = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(
      () =>
        reject(
          new Error(
            "Ngrok timeout (15s) — pastikan authtoken sudah di-config: ngrok config add-authtoken <TOKEN>",
          ),
        ),
      15000,
    );
    let output = "";
    ngrokProcess.stdout?.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      // Cari URL di output ngrok
      const match = output.match(/url=([^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1].replace(/,$/, ""));
      }
    });
    ngrokProcess.on("error", reject);
  });

  console.log(`✅ Tunnel aktif: ${publicUrl}`);
  console.log(
    `   Midtrans notification: ${publicUrl}/api/payment/notification\n`,
  );

  // 3. Jalankan Next.js
  const nextProcess = spawn("npx", ["next", "dev"], {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      NEXT_PUBLIC_BASE_URL: publicUrl,
      AUTH_URL: publicUrl,
    },
  });

  // Cleanup
  const cleanup = () => {
    ngrokProcess.kill();
    nextProcess.kill();
    process.exit(0);
  };

  nextProcess.on("close", (code) => {
    console.log(`\n🛑 Next.js exited (code ${code}).`);
    ngrokProcess.kill();
    process.exit(code ?? 0);
  });
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
