"use client"
import {Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {useSession} from "next-auth/react";
import {useUser} from "@/app/contexts/UserContext";

type Plan = {
  name: string;
  payment_link: string;
  priceId: string;
  productId: string;
  price: number;
  duration: string;
};

const plans : Plan[] = [
  {
    name: "Monthly",
    payment_link: "https://buy.stripe.com/test_00wbJ19pHd8i5lIcPM7AI01",
    priceId: "price_1RxqjpHA86HwMNgKaPC4cMhF",
    productId: "prod_Ste1rkNVRpebnp",
    price: 9,
    duration: "/month"
  },
]

//const smple = "https://buy.stripe.com/test_00wbJ19pHd8i5lIcPM7AI01?prefilled_email=krisna.w2010%40me.com"


export default function Subscription() {

  // Get user email

  const { user, loading } = useUser();

  console.log("user", user)


  if (loading) {
    return <div>Loading...</div>;
  }

  const onClickHandler = async () => {
    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
        }),
      })
    } catch (error) {
      console.error("Error canceling subscription:", error);
    }
  }

  return (
      <div>

        {user?.organization?.subscription == "ACTIVE" && (
          <Card>
            <CardHeader>
              <CardTitle>You are subscribed</CardTitle>
            </CardHeader>
            <CardAction>
              <Button onClick={() => onClickHandler()}>Cancel</Button>
            </CardAction>
          </Card>
        )}

        {user?.organization?.subscription == "INACTIVE" && (
          <Card>
            <CardHeader>
              <CardTitle>
                Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription
              </CardDescription>
            </CardHeader>
            <CardContent>

              <div className="flex space-x-4">
                {plans.map((item: Plan, index) => (
                  <div  key={index}>
                    <Button asChild>
                      <a target="_blank" href={`${item.payment_link}?prefilled_email=${user?.email}`}>
                        Subscribe {item.name}
                      </a>
                    </Button>
                  </div>
                ))}
              </div>

            </CardContent>
          </Card>
        )}



      </div>
  )
}
