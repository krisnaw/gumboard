import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

const stripe = new Stripe(env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const { subscriptionId } = await request.json();

  try {
    // Cancel subscription
    const subscription: Stripe.Subscription = await stripe.subscriptions.cancel(subscriptionId);

    // Update subscription status
    await db.subscription.update({
      where: {
        stripeCustomerId: String(subscription.customer),
      },
      data: {
        status: "CANCELED",
        cancelAtPeriodEnd: true,
      },
    });

    return NextResponse.json({ Success: "Ok" }, { status: 200 });
  } catch (err) {
    let errorMessage = "Sorry, something wrong";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
