import 'dotenv/config';

// Works in Node (reads .env) and in the browser demo build (no process object)
const env = typeof process !== 'undefined' ? process.env : {};

export const config = {
  port: env.PORT || 3001,
  token: env.WHATSAPP_TOKEN,
  phoneNumberId: env.PHONE_NUMBER_ID,
  verifyToken: env.VERIFY_TOKEN,
  appSecret: env.APP_SECRET,
  graphVersion: env.GRAPH_API_VERSION || 'v23.0',
  ai: {
    key: env.ANTHROPIC_API_KEY,                       // server only – NEVER put this in the client/.env
    model: env.ANTHROPIC_MODEL || 'claude-haiku-5-5', // fast and low-cost routing model
    mode: env.AI_MODE || 'auto',                      // auto = use AI when a key is set; off = never
  },
  netcare: {
    provider: env.NETCARE_PROVIDER || 'mock',
    url: env.NETCARE_API_URL,
    key: env.NETCARE_API_KEY,
  },
};
