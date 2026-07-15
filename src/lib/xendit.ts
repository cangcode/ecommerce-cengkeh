import axios from "axios";

const apiKey = process.env.XENDIT_API_KEY;

if (!apiKey) {
  console.warn(
    "⚠️ XENDIT_API_KEY tidak ditemukan di .env. Payment gateway TIDAK akan berfungsi.",
  );
}

const xenditAxios = axios.create({
  baseURL: "https://api.xendit.co",
  auth: {
    username: apiKey ?? "",
    password: "",
  },
  headers: {
    "Content-Type": "application/json",
  },
});

export async function createXenditInvoice(data: {
  externalId: string;
  amount: number;
  payerEmail?: string;
  description?: string;
  customer?: {
    givenNames?: string;
    email?: string;
  };
  items?: {
    name: string;
    quantity: number;
    price: number;
    category?: string;
  }[];
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  currency?: string;
}) {
  try {
    console.log("🔵 [XENDIT] Creating invoice with amount:", data.amount);
    const body: Record<string, unknown> = {
      external_id: data.externalId,
      amount: data.amount,
      currency: data.currency ?? "IDR",
    };
    if (data.payerEmail) body.payer_email = data.payerEmail;
    if (data.description) body.description = data.description;
    if (data.customer) {
      body.customer = {
        given_names: data.customer.givenNames,
        email: data.customer.email,
      };
    }
    if (data.items && data.items.length > 0) {
      body.items = data.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        category: item.category,
      }));
    }
    if (data.successRedirectUrl)
      body.success_redirect_url = data.successRedirectUrl;
    if (data.failureRedirectUrl)
      body.failure_redirect_url = data.failureRedirectUrl;

    const res = await xenditAxios.post("/v2/invoices", body);
    console.log("🟢 [XENDIT] Invoice created:", res.data.id);
    return res.data as {
      id: string;
      invoiceUrl: string;
      externalId: string;
      amount: number;
      status: string;
    };
  } catch (error: any) {
    const detail = error.response?.data ?? error.message;
    console.error(
      "❌ [XENDIT] Invoice creation failed:",
      JSON.stringify(detail),
    );
    throw error;
  }
}

export async function createXenditRefund(data: {
  invoiceId: string;
  amount: number;
  reason?: string;
}) {
  const payload: Record<string, unknown> = {
    amount: data.amount,
  };
  if (data.reason) {
    payload.reason = data.reason;
  }

  try {
    console.log(
      "🔵 [XENDIT] Creating refund for invoice:",
      data.invoiceId,
      "amount:",
      data.amount,
    );
    const res = await xenditAxios.post(
      `/v2/invoices/${data.invoiceId}/refunds`,
      payload,
    );
    console.log("🟢 [XENDIT] Refund created:", res.data.id);
    return res.data as {
      id: string;
      invoiceId: string;
      amount: number;
      status: string;
    };
  } catch (error: any) {
    const detail = error.response?.data ?? error.message;
    console.error("❌ [XENDIT] Refund failed:", JSON.stringify(detail));
    throw error;
  }
}
