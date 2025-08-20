import {NextRequest, NextResponse} from "next/server";
import Stripe from 'stripe';
import {db} from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_d529bbd96d2bf80621e976f5ea63d845d27a2f5d16d384195157e30073413150"

  let event: Stripe.Event;
  // Verify the webhook signature and extract the event.
  // See https://stripe.com/docs/webhooks/signatures for more information.
  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    let errorMessage = "Sorry, something wrong";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return NextResponse.json({"error": errorMessage}, {status: 400})
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        // Handle when a user completes payment for subscription
        // Get user from Stripe
        const session: Stripe.Checkout.Session = await stripe.checkout.sessions.retrieve(event.data.object.id, {expand: ['line_items']});
        const invoice: Stripe.Invoice = await stripe.invoices.retrieve(String(session.invoice))

        // Get the user by email
        const user = await db.user.findUnique({
          where: {email: String(session.customer_details?.email)},
          include: {
            organization: true
          },
        });

        /// If a user exists, store subscription
        if (user) {
          await db.subscription.create({
            data: {
              organizationId: String(user.organization?.id),
              stripeCustomerId: String(session.customer),
              stripeSubscriptionId: String(session.subscription),
              currentPeriodStart: new Date(invoice.period_start * 1000),
              currentPeriodEnd: new Date(invoice.period_end * 1000),
              status: "ACTIVE",
              cancelAtPeriodEnd: false,
            }
          })
        }

        break;
      case 'customer.subscription.deleted':
        // Handle when user cancels subscription
        // Get the subscription details from Stripe
        const stripeSubscription: Stripe.Subscription = await stripe.subscriptions.retrieve(event.data.object.id);

        // Get the subscription by customer and check if it already canceled or not
        const subscription = await db.subscription.findFirst({
          where: {stripeCustomerId: String(stripeSubscription.customer)}
        });

        if (subscription) {
          await db.subscription.update({
            where: {
              id: String(subscription.id)
            },
            data: {
              status: "CANCELED",
              cancelAtPeriodEnd: true,
            }
          })
        }

        break;
      default:
        return;
    }
  } catch (err) {
    let errorMessage = "Sorry, something wrong";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return NextResponse.json({"error": errorMessage}, {status: 400})
  }

  return NextResponse.json({"Success": "Ok"}, {status: 200})
}
