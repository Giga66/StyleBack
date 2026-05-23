export function generateEmailTemplate({
  step,
  customBody,
  brandColor,
  shop,
  checkoutUrl,
  cartItems = [],
  discountCode = null
}) {
  const primaryColor = brandColor || "#000000";
  
  // Default fashion copy
  const defaultBody1 = "We noticed you left something behind. Because this piece is trending, we've locked your cart and reserved your items.";
  const defaultBody2 = "Your reserved cart is expiring soon. We thought you might also like these style pairings.";
  const defaultBody3 = "Here's a special treat for you to complete your look. Use this exclusive code at checkout.";

  let bodyText = "";
  if (step === 1) bodyText = customBody || defaultBody1;
  else if (step === 2) bodyText = customBody || defaultBody2;
  else if (step === 3) bodyText = customBody || defaultBody3;

  const title = step === 1 ? "Did you leave your style behind?" :
                step === 2 ? "Your cart is expiring soon" :
                "A special treat just for you";

  // Build the cart items HTML
  const itemsHtml = cartItems.map(item => `
    <div style="display: flex; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
      <div style="flex: 1; padding-left: 15px;">
        <h3 style="margin: 0; font-size: 16px; color: #333;">${item.title || 'Product'}</h3>
      </div>
    </div>
  `).join('');

  const discountHtml = discountCode ? `
    <div style="background: #f9f9f9; border: 1px dashed ${primaryColor}; padding: 15px; text-align: center; margin: 20px 0;">
      <p style="margin: 0; color: #666; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">Use Code at Checkout</p>
      <h2 style="margin: 10px 0 0; color: ${primaryColor}; letter-spacing: 2px;">${discountCode}</h2>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 40px auto; background: #ffffff; padding: 40px; border-top: 5px solid ${primaryColor}; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-family: 'Didot', 'Times New Roman', serif; font-size: 24px; letter-spacing: 2px; text-transform: uppercase; color: ${primaryColor}; margin: 0; text-decoration: none;">${shop}</h1>
        </div>
        
        <h2 style="font-family: 'Didot', 'Times New Roman', serif; font-size: 28px; font-weight: normal; margin-top: 30px; margin-bottom: 15px; color: #111;">${title}</h2>
        <p style="font-size: 16px; color: #555; margin-bottom: 30px;">${bodyText}</p>
        
        ${discountHtml}
        
        <div style="margin: 30px 0;">
          ${itemsHtml}
        </div>
        
        <div style="text-align: center;">
          <a href="${checkoutUrl || '#'}" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 15px 30px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; font-size: 14px; border-radius: 2px;">Return to Checkout</a>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #999;">
          <p>You received this email because you left items in your cart at <span style="color: ${primaryColor}; text-decoration: none;">${shop}</span>.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
