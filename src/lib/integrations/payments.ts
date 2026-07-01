import "server-only";

export type PaymentProvider = "stripe" | "revolut" | "paypal";

export interface CheckoutSessionInput {
  amount: number;
  currency: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  provider: PaymentProvider | "mock";
  checkoutUrl: string;
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

/**
 * Creates a hosted checkout session for a booking deposit or gift voucher
 * purchase. Only Stripe is wired to a live API call (via a plain fetch to
 * avoid pulling in the Stripe SDK); Revolut Business and PayPal follow the
 * same interface and env-var convention (see lib/integrations/status.ts) so
 * swapping providers doesn't touch call sites — they currently return a mock
 * checkout URL until their API keys are set.
 */
export async function createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult> {
  if (stripeSecretKey) {
    const params = new URLSearchParams({
      "payment_method_types[]": "card",
      "line_items[0][price_data][currency]": input.currency.toLowerCase(),
      "line_items[0][price_data][product_data][name]": input.description,
      "line_items[0][price_data][unit_amount]": String(Math.round(input.amount * 100)),
      "line_items[0][quantity]": "1",
      mode: "payment",
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${stripeSecretKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    if (res.ok) {
      const data = await res.json();
      return { provider: "stripe", checkoutUrl: data.url };
    }
  }

  return { provider: "mock", checkoutUrl: `${input.successUrl}?mock_payment=true` };
}
