import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);
  console.log(`Received GDPR ${topic} webhook for ${shop}`);
  // Handle customer data request according to GDPR rules
  return new Response();
};
