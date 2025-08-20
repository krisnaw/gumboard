import {NextRequest, NextResponse} from "next/server";
import Stripe from 'stripe';
import {db} from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.text();


  const signature = request.headers.get("stripe-signature")!;
  const endpointSecret = "whsec_d529bbd96d2bf80621e976f5ea63d845d27a2f5d16d384195157e30073413150"

  let event;


  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    // @ts-ignore
    console.log(`⚠️ Webhook signature verification failed.`, err.message);
    // @ts-ignore
    return NextResponse.json({"Success": "Ok"}, {status: 200})
  }

  // Handle the event

  const data = event.data;
  const eventType = event.type;

  try {
    switch (eventType) {
      case 'checkout.session.completed':
        // Handle when user completes payment for subscription

        const session = await stripe.checkout.sessions.retrieve(data.object.id, {
          expand: ['line_items'],
        });
        const customerId = session?.customer;
        const customer = await stripe.customers.retrieve(customerId);
        const priceId = session?.line_items?.data[0]?.price.id;
        const subscriptionId = session?.subscription;


        console.log(session)
        console.log(customerId)
        console.log(priceId)
        console.log(customer)


        if (customer.email) {
          const user = await db.user.findUnique({
            where: { email: customer.email },
            include: {
              organization: true
            },
          });
          console.log("user", user)

          // Store subscription
          if (user?.organization) {
            await db.subscription.create({
              data: {
                organizationId: user.organization.id,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                status : "ACTIVE",
              }
            })
          }

        }



        break;
      case 'customer.subscription.deleted':
        // Handle when user cancels subscription
        console.log(event)


        // Get the subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(
          data.object.id
        );

        console.log(subscription)


        // Set the subscription status to "CANCELED"
        const update = await db.subscription.update({
          where: {
            stripeCustomerId: subscription.customer as string,
          },
          data: {
            status: "CANCELED",
          },
        })

        console.log(update)

        break;
      default:
        return;
    }
  } catch (err) {
    console.log(err.message)
  }

  return NextResponse.json({"Success": "Ok"}, {status: 200})
}
