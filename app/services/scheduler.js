import db from "../db.server";
import { generateEmailTemplate } from "./emailTemplates";
import { Resend } from 'resend';

const POLLING_INTERVAL_MS = 60 * 1000; // 1 minute

// Initialize Resend with the production API key
const resend = new Resend('re_TNCiqg4K_HcVVPVmGSzUUdZQoSX7Thqus');

import { unauthenticated } from "../shopify.server";

async function sendRealEmail(cart, step, settings) {
  try {
    const { admin } = await unauthenticated.admin(cart.shop);
    let items = JSON.parse(cart.cartContents || '[]');
    let discountCode = step === 3 ? settings.discountCode : null;
    let customBody = step === 1 ? settings.email1Body : step === 2 ? settings.email2Body : settings.email3Body;

    // Fetch images for items
    try {
      for (let item of items) {
        if (item.product_id && !item.image_url) {
          const response = await admin.graphql(`
            query getProductImage($id: ID!) {
              product(id: $id) {
                featuredImage { url }
              }
            }
          `, { variables: { id: `gid://shopify/Product/${item.product_id}` } });
          const data = await response.json();
          if (data.data?.product?.featuredImage?.url) {
            item.image_url = data.data.product.featuredImage.url;
          }
        }
      }
    } catch (err) { console.error("GraphQL Image Error:", err); }

    // STEP 1: Scarcity (Query Inventory)
    if (step === 1 && items.length > 0 && items[0].product_id) {
      try {
        const response = await admin.graphql(`
          query getInventory($id: ID!) {
            product(id: $id) {
              totalInventory
            }
          }
        `, { variables: { id: `gid://shopify/Product/${items[0].product_id}` } });
        const data = await response.json();
        const inventory = data.data?.product?.totalInventory;
        if (inventory !== undefined && inventory < 5) {
          customBody = `Hurry! There are only ${inventory} items left in stock. ` + (customBody || '');
        }
      } catch (err) { console.error("GraphQL Scarcity Error:", err); }
    }

    // STEP 2: Pairings (Product Recommendations)
    if (step === 2 && items.length > 0 && items[0].product_id) {
      try {
        const response = await admin.graphql(`
          query getRecommendations($id: ID!) {
            productRecommendations(productId: $id) {
              title
              featuredImage { url }
            }
          }
        `, { variables: { id: `gid://shopify/Product/${items[0].product_id}` } });
        const data = await response.json();
        const recs = data.data?.productRecommendations || [];
        if (recs.length > 0) {
          items = [...items, { title: `Pair it with: ${recs[0].title}` }];
        }
      } catch (err) { console.error("GraphQL Pairings Error:", err); }
    }

    // STEP 3: Generate Temporary Discount Code
    if (step === 3) {
      try {
        discountCode = `STYLEBACK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        // In a real production app, we would execute discountCodeBasicCreate mutation here
        // to register this code in the merchant's Shopify store.
      } catch (err) { console.error("GraphQL Discount Error:", err); }
    }

    const html = generateEmailTemplate({
      step,
      customBody,
      brandColor: settings.brandColor,
      shop: cart.shop,
      checkoutUrl: cart.checkoutUrl || `https://${cart.shop}/cart`,
      cartItems: items,
      discountCode
    });

    // Since this is a new Resend account without a verified domain,
    // we must use Resend's default onboarding email as the sender for now.
    const { data: info, error: resendError } = await resend.emails.send({
      from: `StyleBack Concierge <support@novaproductionsx.com>`,
      to: cart.customerEmail,
      subject: step === 1 ? "Your Cart is Reserved" : step === 2 ? "Style Pairings for You" : "A Special Gift Inside",
      html: html,
      reply_to: settings.replyToEmail || undefined
    });

    if (resendError) {
      console.error(`[EMAIL ERROR] Resend rejected the email:`, resendError);
      return false;
    }

    console.log(`[EMAIL SENT VIA RESEND] Step ${step} to ${cart.customerEmail}. ID: ${info.id}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send step ${step} email:`, error);
    return false;
  }
}

async function processScheduledEmails() {
  console.log("Checking for pending emails...");
  const now = new Date();
  
  try {
    const dueSchedules = await db.emailSchedule.findMany({
      where: {
        status: "PENDING",
        scheduledSendAt: {
          lte: now
        }
      },
      include: {
        cart: true
      }
    });

    for (const schedule of dueSchedules) {
      const settings = await db.merchantSettings.findUnique({
        where: { shop: schedule.shop }
      });

      console.log(`Sending sequence ${schedule.sequenceStep} to ${schedule.cart.customerEmail} for shop ${schedule.shop}`);
      
      const emailSent = await sendRealEmail(schedule.cart, schedule.sequenceStep, settings);
      
      if (emailSent) {
        await db.emailSchedule.update({
          where: { id: schedule.id },
          data: { status: "SENT" }
        });
        console.log(`Successfully sent and updated schedule ${schedule.id}`);
      }
    }
  } catch (err) {
    console.error("Error processing scheduled emails:", err);
  }
}

function mockSendEmail(email, step) {
  console.log(`[MOCK EMAIL] Sending email step ${step} to ${email}...`);
  // Simulate network success
  return true;
}

export function startScheduler() {
  console.log("Starting email scheduler...");
  setInterval(processScheduledEmails, POLLING_INTERVAL_MS);
}
