import dotenv from 'dotenv';
dotenv.config();

const PHONE_NUMBER_ID = process.env.IDENTIFIER_WP_NUMBER;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN_WP_BUSINESS;
const RECIPIENT_PHONE = process.env.WA_TEST_RECIPIENT || '5493513467739';

// Debug: check if env vars are loaded
console.log('PHONE_NUMBER_ID:', PHONE_NUMBER_ID || '(not set)');
console.log('ACCESS_TOKEN:', ACCESS_TOKEN ? `${ACCESS_TOKEN.slice(0, 10)}...${ACCESS_TOKEN.slice(-10)}` : '(not set)');
console.log('RECIPIENT_PHONE:', RECIPIENT_PHONE);
console.log('---');

async function sendWhatsAppMessage() {
  const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;

  const body = {
    messaging_product: 'whatsapp',
    to: RECIPIENT_PHONE,
    type: 'template',
    template: {
      name: 'jaspers_market_order_confirmation_v1',
      language: { code: 'en_US' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Testing Doooe' },
            { type: 'text', text: '123456' },
            { type: 'text', text: 'Jan 19, 2026' },
          ],
        },
      ],
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error:', response.status, response.statusText);
      console.error('Response:', JSON.stringify(data, null, 2));
      return;
    }

    console.log('Success! Message sent.');
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
}

sendWhatsAppMessage();
