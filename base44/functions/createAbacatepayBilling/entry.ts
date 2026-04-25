import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ABACATEPAY_API_KEY = Deno.env.get("ABACATEPAY_API_KEY");
const BASE_URL = "https://api.abacatepay.com/v1";

// Formata CPF: "12345678900" → "123.456.789-00"
function formatCpf(cpf) {
  const digits = cpf.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 11) {
    return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
  }
  return digits;
}

const PLANS = {
  mensal:  { name: "DesenhosFlix Mensal",   amount: 1990,  frequency: "ONE_TIME" },
  premium: { name: "DesenhosFlix Premium",  amount: 2990,  frequency: "ONE_TIME" },
  anual:   { name: "DesenhosFlix Anual",    amount: 19900, frequency: "ONE_TIME" },
};

const headers = {
  "Authorization": `Bearer ${ABACATEPAY_API_KEY}`,
  "Content-Type": "application/json",
  "accept": "application/json",
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { plan, payment_method, customer } = await req.json();

  if (!PLANS[plan]) return Response.json({ error: "Plano inválido" }, { status: 400 });

  const planInfo = PLANS[plan];

  // 1. Criar cliente na AbacatePay
  const customerRes = await fetch(`${BASE_URL}/customer/create`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: customer?.name || user.full_name || user.email,
      email: user.email,
      cellphone: customer?.phone || "(00) 00000-0000",
      taxId: formatCpf(customer?.cpf || ""),
    }),
  });

  const customerData = await customerRes.json();
  const customerId = customerData?.data?.id;

  if (!customerId) {
    return Response.json({ error: "Erro ao criar cliente", details: customerData }, { status: 500 });
  }

  // 2. Criar cobrança
  const origin = req.headers.get("origin") || "https://desenhoflix.com";
  const methods = payment_method === "pix" ? ["PIX"] : ["CARD"];

  const billingRes = await fetch(`${BASE_URL}/billing/create`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      frequency: planInfo.frequency,
      methods,
      products: [{
        externalId: plan,
        name: planInfo.name,
        description: `Assinatura ${planInfo.name}`,
        quantity: 1,
        price: planInfo.amount,
      }],
      returnUrl: `${origin}/Home`,
      completionUrl: `${origin}/Home`,
      customerId,
    }),
  });

  const billingData = await billingRes.json();
  const billing = billingData?.data;

  if (!billing?.id) {
    return Response.json({ error: "Erro na resposta da AbacatePay", details: billingData }, { status: 500 });
  }

  // 3. Salvar assinatura pendente
  const now = new Date();
  const expiresAt = new Date(now);
  if (plan === "anual") expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  else expiresAt.setMonth(expiresAt.getMonth() + 1);

  await base44.entities.Subscription.create({
    user_email: user.email,
    plan,
    status: "pending",
    payment_method,
    abacatepay_billing_id: billing.id,
    abacatepay_customer_id: customerId,
    starts_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  });

  return Response.json({
    billing_url: billing.url,
    billing_id: billing.id,
    customer_id: customerId,
  });
});