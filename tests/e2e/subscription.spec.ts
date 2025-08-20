import { test, expect } from "../fixtures/test-helpers";

test.describe("Subscription on Organization page", () => {
  // Use case when user never subscribes before
  // Expect there is a Subscription Button
  test("should display subscription button", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/setting/organization");

    // Define the locator for the subscription message

    const subscriptionMessage = authenticatedPage.getByTestId("subscription-message");

    const expectText = "Upgrade to the Team plan for $9/month to invite more than 2 members.";
    await expect(subscriptionMessage).toHaveText(expectText);
  });

  // // Use case when user currently subscribed
  // // Expect there is a Cancel Subscription Button
  // test("should display cancel button", async ({authenticatedPage}) => {
  //
  //
  //   // Create subscription first
  //
  //   // Go to setting organization page
  //   await authenticatedPage.goto("/setting/organization")
  //   // Verify the UI
  //   // Verify the DB
  // })
  //
  // // Use case when user cancels subscription
  // test("should display resume subscription button", async ({authenticatedPage}) => {
  //   await authenticatedPage.goto("/setting/organization")
  //
  //   // Verify the UI
  //   // Verify the DB
  // })
  //
});
