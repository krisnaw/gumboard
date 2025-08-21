import {test, expect} from "../fixtures/test-helpers";

test.describe("Subscription on Organization page", () => {

  test("Should show “Subscribe” button when user reaches free plan limit",
    async ({authenticatedPage, testContext, testPrisma}) => {
      // Create second member to test subscription
      await testPrisma.user.create({
        data: {
          organizationId: testContext.organizationId,
          isAdmin: false,
          email: "test@mail.com"
        },
      });

      await authenticatedPage.goto("/settings/organization");

      await expect(authenticatedPage.locator('h3', {hasText: /^Team Members$/})).toBeVisible();
      await expect(authenticatedPage.locator("text=Free plan: 2 Member limit")).toBeVisible();

      const subscribeLink = authenticatedPage.getByRole('link', {name: 'Subscribe'});

      // Wait for a new page to open when clicking
      const [newPage] = await Promise.all([
        authenticatedPage.waitForEvent('popup'), // listens for target="_blank"
        subscribeLink.click(),                   // action that triggers it
      ]);

      // ✅ Assert URL starts with the Stripe Payment link
      await expect(newPage).toHaveURL(/^https:\/\/buy\.stripe\.com/);
    })

  test("Should show “Cancel Subscription” button when user has an active subscription",
    async ({authenticatedPage, testContext, testPrisma}) => {

      // Create subscription data
      await testPrisma.subscription.create({
        data: {
          organizationId: testContext.organizationId,
          stripeCustomerId: "cus_O4zTg8l2aBc123",
          stripeSubscriptionId: "sub_1P2xXz2eZvKYlo2Cw3qX4567",
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })

      await authenticatedPage.goto("/settings/organization");


      await expect(authenticatedPage.locator('h3', {hasText: /^Team Members$/})).toBeVisible();

      await expect(authenticatedPage.getByText("You are currently on a paid plan")).toBeVisible();

      const cancelBtn = authenticatedPage.getByRole('button', {name: 'Cancel Subscription'});
      await expect(cancelBtn).toBeVisible();
      await cancelBtn.click();

      // Update subscription to cancel
      await testPrisma.subscription.update({
        where: {
          organizationId: testContext.organizationId
        },
        data: {
          status: "CANCELED",
          cancelAtPeriodEnd: true,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })

      const resumeSubLink = authenticatedPage.getByRole('link', {name: 'Resume Subscription'});
      await expect(resumeSubLink).toBeVisible();


      const [newPage] = await Promise.all([
        authenticatedPage.waitForEvent('popup'), // listens for target="_blank"
        resumeSubLink.click(),                   // action that triggers it
      ]);

      // ✅ Assert URL starts with the Stripe Payment link
      await expect(newPage).toHaveURL(/^https:\/\/buy\.stripe\.com/);

    })

  test("Should show “Resume Subscription” button when user’s subscription is canceled",
    async ({authenticatedPage, testContext, testPrisma}) => {

      // Create subscription data
      await testPrisma.subscription.create({
        data: {
          organizationId: testContext.organizationId,
          stripeCustomerId: "cus_O4zTg8l2aBc125",
          stripeSubscriptionId: "sub_1P2xXz2eZvKYlo2Cw3qX4567",
          status: "CANCELED",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })

      await authenticatedPage.goto("/settings/organization");

      await expect(authenticatedPage.locator('h3', {hasText: /^Team Members$/})).toBeVisible();

      await expect(authenticatedPage.getByText("Your subscription is canceled.")).toBeVisible();

      const resumeSubLink = authenticatedPage.getByRole('link', {name: 'Resume Subscription'});
      await expect(resumeSubLink).toBeVisible();

      // Wait for a new page to open when clicking
      const [newPage] = await Promise.all([
        authenticatedPage.waitForEvent('popup'), // listens for target="_blank"
        resumeSubLink.click(),                   // action that triggers it
      ]);

      // ✅ Assert URL starts with the Stripe Payment link
      await expect(newPage).toHaveURL(/^https:\/\/buy\.stripe\.com/);
    });

});
