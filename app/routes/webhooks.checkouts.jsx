import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  
  console.log(`Received ${topic} webhook for ${shop}`);

  if (topic === "CHECKOUTS_CREATE" || topic === "CHECKOUTS_UPDATE" || topic === "checkouts/create" || topic === "checkouts/update") {
    if (payload.email) {
      const checkoutToken = payload.token;
      
      const cart = await db.abandonedCart.upsert({
        where: { checkoutToken },
        create: {
          shop,
          checkoutToken,
          customerEmail: payload.email,
          cartContents: JSON.stringify(payload.line_items || []),
          status: "PENDING",
        },
        update: {
          customerEmail: payload.email,
          cartContents: JSON.stringify(payload.line_items || []),
        }
      });
      
      const existingSchedules = await db.emailSchedule.findFirst({ where: { cartId: cart.id } });
      
      if (!existingSchedules) {
        const settings = await db.merchantSettings.findUnique({ where: { shop } }) || {
          delay1Hour: 1,
          delay2Hour: 24,
          delay3Hour: 72
        };
        
        const now = new Date();
        
        await db.emailSchedule.createMany({
          data: [
            {
              cartId: cart.id,
              shop,
              sequenceStep: 1,
              scheduledSendAt: new Date(now.getTime() + settings.delay1Hour * 60 * 60 * 1000)
            },
            {
              cartId: cart.id,
              shop,
              sequenceStep: 2,
              scheduledSendAt: new Date(now.getTime() + settings.delay2Hour * 60 * 60 * 1000)
            },
            {
              cartId: cart.id,
              shop,
              sequenceStep: 3,
              scheduledSendAt: new Date(now.getTime() + settings.delay3Hour * 60 * 60 * 1000)
            }
          ]
        });
      }
    }
  }

  return new Response();
};
