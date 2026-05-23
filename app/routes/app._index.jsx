import { useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { admin, session, billing } = await authenticate.admin(request);
  
  try {
    await billing.require({
      plans: ['styleback-lifetime-access'],
      onFailure: async () => billing.request({
        plan: 'styleback-lifetime-access',
        isTest: true,
        returnUrl: `https://${session.shop}/admin/apps/styleback`,
      }),
    });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    return { billingError: error.message, errorData: JSON.stringify(error) };
  }

  const shop = session.shop;

  let settings = await db.merchantSettings.findUnique({ where: { shop } });
  if (!settings) {
    settings = await db.merchantSettings.create({
      data: { shop }
    });
  }

  const carts = await db.abandonedCart.findMany({ where: { shop } });
  const totalCarts = carts.length;
  const recoveredCarts = carts.filter(c => c.status === "RECOVERED").length;
  const recoveryRate = totalCarts > 0 ? Math.round((recoveredCarts / totalCarts) * 100) : 0;

  return { settings, stats: { totalCarts, recoveredCarts, recoveryRate } };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  
  const replyToEmail = formData.get("replyToEmail");
  const brandColor = formData.get("brandColor");
  const d1 = formData.get("delay1Hour");
  const delay1Hour = d1 ? parseInt(d1, 10) : 0;
  
  const d2 = formData.get("delay2Hour");
  const delay2Hour = d2 ? parseInt(d2, 10) : 24;
  
  const d3 = formData.get("delay3Hour");
  const delay3Hour = d3 ? parseInt(d3, 10) : 72;

  const email1Body = formData.get("email1Body");
  const email2Body = formData.get("email2Body");
  const email3Body = formData.get("email3Body");

  await db.merchantSettings.update({
    where: { shop },
    data: {
      replyToEmail,
      brandColor,
      delay1Hour,
      delay2Hour,
      delay3Hour,
      email1Body,
      email2Body,
      email3Body
    }
  });

  return { success: true };
};

export default function Index() {
  const data = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const { settings, stats } = data;
  const isSaving = fetcher.state === "submitting";

  if (data.billingError) {
    return (
      <div style={{ padding: '2rem', color: 'white', background: '#990000', fontFamily: 'sans-serif' }}>
        <h2>Billing Error: {data.billingError}</h2>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{data.errorData}</pre>
        <p>This usually means your app is set to "Custom Distribution" instead of "Public/App Store Distribution" in the Partner Dashboard.</p>
      </div>
    );
  }

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show("Settings saved successfully!");
    }
  }, [fetcher.data, shopify]);

  useEffect(() => {
    // Crisp Live Chat Initialization
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = "cb7b3676-c151-4951-a558-aceab868561a";
    (function() {
      var d = document;
      var s = d.createElement("script");
      s.src = "https://client.crisp.chat/l.js";
      s.async = 1;
      d.getElementsByTagName("head")[0].appendChild(s);
    })();
  }, []);

  return (
    <div style={{ fontFamily: '"Montserrat", "Helvetica Neue", Helvetica, Arial, sans-serif', padding: '2.5rem', background: '#0a0a0a', minHeight: '100vh', color: '#f8fafc' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ marginBottom: '3.5rem', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '150px', background: 'radial-gradient(ellipse at top, rgba(212, 175, 55, 0.15), transparent 70%)', pointerEvents: 'none' }}></div>
          <h1 style={{ fontFamily: '"Didot", "Bodoni MT", "Times New Roman", serif', fontSize: '3.5rem', fontWeight: '400', color: '#D4AF37', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>
            StyleBack
          </h1>
          <p style={{ color: '#888', fontSize: '1rem', marginTop: '0.5rem', letterSpacing: '4px', textTransform: 'uppercase' }}>Cart Recovery Concierge</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          <StatCard title="Total Abandoned" value={stats.totalCarts} icon="🛒" />
          <StatCard title="Recovered Carts" value={stats.recoveredCarts} icon="✨" />
          <StatCard title="Recovery Rate" value={`${stats.recoveryRate}%`} icon="📈" />
        </div>

        <div style={{ background: 'rgba(212, 175, 55, 0.05)', borderRadius: '12px', padding: '2rem', border: '1px solid rgba(212, 175, 55, 0.3)', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.3rem', color: '#D4AF37', margin: '0 0 1rem 0', fontWeight: '400', letterSpacing: '1px' }}>How StyleBack Works</h2>
          <p style={{ color: '#ccc', lineHeight: '1.6', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            StyleBack is your automated cart recovery concierge. When a customer leaves items in their checkout, we wait for the delays you configure below, and automatically send a series of 3 high-converting emails designed to win them back without looking desperate:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#111', padding: '1rem', borderRadius: '8px' }}>
              <h4 style={{ color: '#fff', margin: '0 0 0.5rem 0' }}>1. The Reservation</h4>
              <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>Creates scarcity by claiming their cart is temporarily reserved. Checks live inventory for "Low Stock" warnings.</p>
            </div>
            <div style={{ background: '#111', padding: '1rem', borderRadius: '8px' }}>
              <h4 style={{ color: '#fff', margin: '0 0 0.5rem 0' }}>2. The Pairings</h4>
              <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>Uses Shopify's AI recommendations to show them items that perfectly match what's in their cart.</p>
            </div>
            <div style={{ background: '#111', padding: '1rem', borderRadius: '8px' }}>
              <h4 style={{ color: '#fff', margin: '0 0 0.5rem 0' }}>3. The Offer</h4>
              <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>Generates a unique discount code just for them to close the sale before the items are released.</p>
            </div>
          </div>
        </div>

        <div style={{ background: '#111', borderRadius: '12px', padding: '3rem', border: '1px solid rgba(212, 175, 55, 0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.5), transparent)' }}></div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '400', marginBottom: '2rem', color: '#D4AF37', letterSpacing: '1px' }}>Brand Configuration</h2>
          
          <fetcher.Form method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <Input label="Reply-To Email" name="replyToEmail" defaultValue={settings.replyToEmail || ''} placeholder="concierge@yourbrand.com" />
              <Input label="Brand Color (Hex)" name="brandColor" defaultValue={settings.brandColor || '#000000'} placeholder="#000000" />
            </div>
            
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#ccc', marginBottom: '1rem', fontWeight: '400', letterSpacing: '0.5px' }}>Sequence Delays (Hours)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <Input label="Email 1 (Urgency)" name="delay1Hour" type="number" defaultValue={settings.delay1Hour} />
                <Input label="Email 2 (Pairings)" name="delay2Hour" type="number" defaultValue={settings.delay2Hour} />
                <Input label="Email 3 (Offer)" name="delay3Hour" type="number" defaultValue={settings.delay3Hour} />
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#ccc', marginBottom: '1rem', fontWeight: '400', letterSpacing: '0.5px' }}>Email Copy Customization</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                <Textarea label="Email 1 (The Reservation) Text" name="email1Body" defaultValue={settings.email1Body || "We noticed you left something behind. Because this piece is trending, we've locked your cart and reserved your items."} />
                <Textarea label="Email 2 (The Pairings) Text" name="email2Body" defaultValue={settings.email2Body || "Your reserved cart is expiring soon. We thought you might also like these style pairings."} />
                <Textarea label="Email 3 (The Offer) Text" name="email3Body" defaultValue={settings.email3Body || "Here's a special treat for you to complete your look. Use this exclusive code at checkout."} />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSaving}
              style={{ 
                marginTop: '1.5rem', 
                padding: '1rem 3rem', 
                background: 'linear-gradient(135deg, #D4AF37 0%, #AA771C 100%)', 
                color: '#000', 
                border: 'none', 
                borderRadius: '4px', 
                fontSize: '1rem', 
                fontWeight: '600', 
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                alignSelf: 'center',
                boxShadow: '0 4px 15px rgba(212, 175, 55, 0.2)'
              }}
              onMouseOver={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.4)'}
              onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 15px rgba(212, 175, 55, 0.2)'}
            >
              {isSaving ? 'Saving...' : 'Update Settings'}
            </button>
          </fetcher.Form>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div style={{ 
      background: '#111', 
      borderRadius: '8px', 
      padding: '2rem', 
      border: '1px solid rgba(212, 175, 55, 0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem',
      transition: 'border-color 0.3s ease'
    }}
    onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)'}
    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.15)'}
    >
      <div style={{ fontSize: '2rem', opacity: 0.8 }}>{icon}</div>
      <div>
        <div style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>{title}</div>
        <div style={{ color: '#D4AF37', fontSize: '2.5rem', fontWeight: '300' }}>{value}</div>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ color: '#aaa', fontSize: '0.85rem', letterSpacing: '0.5px' }}>{label}</label>
      <input 
        {...props} 
        style={{ 
          background: '#0a0a0a', 
          border: '1px solid #333', 
          borderRadius: '4px', 
          padding: '1rem', 
          color: '#fff',
          fontSize: '1rem',
          outline: 'none',
          transition: 'all 0.3s ease'
        }} 
        onFocus={e => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(212,175,55,0.3)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.boxShadow = 'none'; }}
      />
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ color: '#aaa', fontSize: '0.85rem', letterSpacing: '0.5px' }}>{label}</label>
      <textarea 
        {...props} 
        rows="3"
        style={{ 
          background: '#0a0a0a', 
          border: '1px solid #333', 
          borderRadius: '4px', 
          padding: '1rem', 
          color: '#fff',
          fontSize: '1rem',
          outline: 'none',
          transition: 'all 0.3s ease',
          resize: 'vertical'
        }} 
        onFocus={e => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(212,175,55,0.3)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.boxShadow = 'none'; }}
      />
    </div>
  );
}
