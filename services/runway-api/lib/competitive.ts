import * as boost from './legacy/island-boost-14';
import * as current from './simulation';
import * as pages from './legacy/island-routes-10';
import * as glide from './legacy/island-glide-13';

// Exact origins, never a wildcard: bearer identities remain private to the client.
export const publishedOrigins = new Set([
 'https://humanfriendly.global',
 'https://runway-islanddaoxhumanfriendly.pages.dev',
]);
export const allowedOrigins = new Set([
 ...publishedOrigins,
 'https://runway-islanddao.agenciahumanfriendly.chatgpt.site',
 'http://127.0.0.1:5180', 'http://localhost:5180',
]);
export const simulations = [current, boost, glide, pages] as const;
export const simulationFor = (content: unknown) => simulations.find(s => s.CONTENT === content);

// The existing Pages release sends {} and rejects tickets with another content
// version. Keep its original server replay until that client is upgraded.
// New clients explicitly negotiate content; a ticket fixes it for its lifetime.
export function ticketSimulation(body: Record<string, unknown>, origin: string | null) {
 const simulation = body.content === undefined
  ? (publishedOrigins.has(origin ?? '') ? pages : glide)
  : simulationFor(body.content);
 return simulation && (body.rules === undefined || body.rules === simulation.RULES) ? simulation : undefined;
}
