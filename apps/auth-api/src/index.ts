import { serve } from '@hono/node-server';
import { app } from './app.js';
import { getAuthConfig } from './config.js';

const port = Number(process.env.PORT ?? 3001);
const config = getAuthConfig();

serve({
  fetch: app.fetch,
  port
});

console.log(
  `Auth service listening on http://localhost:${port} (issuer: ${config.issuer}, audience: ${config.audience})`
);
