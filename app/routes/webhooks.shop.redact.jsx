import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);
  console.log(`Received GDPR ${topic} webhook for ${shop}`);
  
  // Clean up shop data according to GDPR rules
  await db.merchantSettings.deleteMany({ where: { shop } });
  await db.abandonedCart.deleteMany({ where: { shop } });
  await db.emailSchedule.deleteMany({ where: { shop } });
  await db.session.deleteMany({ where: { shop } });

  return new Response();
};
