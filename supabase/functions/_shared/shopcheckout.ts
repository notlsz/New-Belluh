// Real orders through Shop (Shopify's agent checkout, https://shop.dev/docs): Bella finds the actual product, opens a
// checkout at the shop that sells it with the delivery address already in, and checks the shop can deliver there.
// What comes back is the shop's own review-and-pay page (Shop Pay), with the real total including tax: one tap and
// it's ordered. Bella never pays on its own. Signed-in completion (no tap) needs a Shop client registered for Belluh;
// until then every order ends on that page. Pure parsing is unit-tested; network failures just mean no ready order.

import type { ShopProduct } from './shopify.ts';

const env = (k: string) => { try { return (globalThis as any).Deno?.env.get(k) ?? undefined; } catch { return undefined; } };
const SHOP_MCP = () => env('SHOP_MCP_URL') || 'https://mcp.shop.com/';
const PROTOCOL = '2026-07-28';

export interface Recipient {
  first_name: string; last_name?: string;
  street_address: string; extended_address?: string;
  address_locality: string; address_region: string; postal_code: string; address_country: string;
}

export interface Offer { title: string; variantId: string; shop: string; seller: string; priceCents: number; image: string | null }

export interface ReadyOrder extends ShopProduct { total: string; totalCents: number; deliversTo: string; ready: true }

const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

const STATES: Record<string, string> = { alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY', 'district of columbia': 'DC' };

/**
 * A US street address in one line ("1 Ocean Ave, Apt 4, San Francisco, CA 94112") as the fields a checkout needs.
 * Anything without a street, a city, a state and a ZIP is null: Bella asks for the address instead of guessing.
 */
export function parseUsAddress(text: unknown, name?: string | null): Recipient | null {
  if (typeof text !== 'string') return null;
  const parts = text.replace(/\s+/g, ' ').replace(/,?\s*(USA|United States( of America)?|US)\.?$/i, '').split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length < 3) return null;
  const tail = parts[parts.length - 1].match(/^([A-Za-z .]+?)\s+(\d{5})(?:-\d{4})?$/);
  if (!tail) return null;
  const st = tail[1].trim();
  const region = st.length === 2 ? st.toUpperCase() : STATES[st.toLowerCase()];
  if (!region || !Object.values(STATES).includes(region)) return null;
  const city = parts[parts.length - 2];
  const street = parts[0];
  if (!/\d/.test(street) || street.length < 4 || city.length < 2) return null;
  const extra = parts.slice(1, -2).join(', ');
  const [first, ...rest] = (typeof name === 'string' ? name.trim() : '').split(/\s+/).filter(Boolean);
  return {
    first_name: (first || 'Gift').slice(0, 40), ...(rest.length ? { last_name: rest.join(' ').slice(0, 60) } : { last_name: 'Recipient' }),
    street_address: street.slice(0, 120), ...(extra ? { extended_address: extra.slice(0, 80) } : {}),
    address_locality: city.slice(0, 60), address_region: region, postal_code: tail[2], address_country: 'US',
  };
}

/** Flowers that aren't fresh flowers: skipped when someone asks Bella to send flowers. */
export const NOT_FRESH_FLOWERS = /\b(paper|silk|artificial|faux|fake|dried|preserved|wood(en)?|felt|crochet|knit|lego|plush|soap|candle|print|poster|card|sticker|seeds?|kit|vase only|ornament|earrings?|necklace|pin)\b/i;

const oneLine = (r: Recipient) => [r.street_address, r.extended_address, r.address_locality, `${r.address_region} ${r.postal_code}`].filter(Boolean).join(', ');

/** Shop's search results as offers Bella can check out: in stock, in dollars, with the exact variant and shop. */
export function parseOffers(json: unknown, maxCents?: number | null, exclude?: RegExp): Offer[] {
  const sc = (json as any)?.result?.structuredContent ?? (() => { try { return JSON.parse((json as any)?.result?.content?.[0]?.text ?? 'null'); } catch { return null; } })();
  const out: Offer[] = [];
  for (const p of (sc?.products ?? []) as any[]) {
    const v = (Array.isArray(p?.variants) ? p.variants : []).find((x: any) => typeof x?.id === 'string' && x.id.startsWith('gid://shopify/ProductVariant/') && x?.availability?.available !== false);
    const price = Number(v?.price?.amount ?? p?.price_range?.min?.amount);
    const cur = v?.price?.currency ?? p?.price_range?.min?.currency;
    const shop = v?.seller?.domain;
    if (!v || typeof p?.title !== 'string' || cur !== 'USD' || !(price > 0) || typeof shop !== 'string' || !/^[a-z0-9.-]+$/i.test(shop)) continue;
    if (maxCents && price > maxCents) continue;
    if (exclude && exclude.test(`${p.title} ${v.title ?? ''} ${v.seller?.name ?? ''}`)) continue;
    const img = [...(Array.isArray(v.media) ? v.media : []), ...(Array.isArray(p.media) ? p.media : [])].find((m: any) => typeof m?.url === 'string' && m.url.startsWith('https://'))?.url ?? null;
    out.push({ title: p.title.replace(/\s+/g, ' ').trim().slice(0, 90), variantId: v.id, shop, seller: String(v.seller?.name || shop).slice(0, 40), priceCents: price, image: img });
  }
  return out;
}

/** Why a checkout can't go ahead to this address, or null when it can be paid. A phone number the shop asks for is
 *  fine: they enter it when they pay. */
export function blockedReason(checkout: any): string | null {
  if (!checkout || typeof checkout.continue_url !== 'string' || !checkout.continue_url.startsWith('https://')) return 'no checkout';
  if (checkout.status === 'canceled' || checkout.status === 'completed') return checkout.status;
  const codes = ((checkout.messages ?? []) as any[]).map(m => String(m?.code ?? ''));
  const bad = codes.find(c => /no_delivery|not_deliverable|cannot_ship|unavailable|out_of_stock|sold_out|merchandise_not_enough_stock/.test(c));
  return bad ?? null;
}

const totalOf = (checkout: any): number | null => {
  const t = ((checkout?.totals ?? []) as any[]).find(x => x?.type === 'total');
  return Number.isFinite(Number(t?.amount)) && Number(t.amount) > 0 ? Number(t.amount) : null;
};

async function call(name: string, args: Record<string, unknown>, fetchImpl: typeof fetch, timeoutMs = 9000): Promise<any | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetchImpl(SHOP_MCP(), {
      method: 'POST', signal: ctl.signal,
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': PROTOCOL, 'Mcp-Method': 'tools/call', 'Mcp-Name': name },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args, _meta: { 'io.modelcontextprotocol/protocolVersion': PROTOCOL, 'io.modelcontextprotocol/clientCapabilities': {} } } }),
    });
    if (!r.ok) { console.error('Shop', name, r.status); return null; }
    return await r.json();
  } catch (e) { console.error('Shop', name, String(e).slice(0, 120)); return null; } finally { clearTimeout(t); }
}

export async function searchOffers(query: string, opts: { postalCode?: string; maxCents?: number | null; intent?: string; exclude?: RegExp } = {}, fetchImpl: typeof fetch = fetch): Promise<Offer[]> {
  const q = query.replace(/\s+/g, ' ').trim().slice(0, 100);
  if (q.length < 2) return [];
  const json = await call('search_catalog', { catalog: { query: q, context: { address_country: 'US', ...(opts.postalCode ? { postal_code: opts.postalCode } : {}), ...(opts.intent ? { intent: opts.intent.slice(0, 120) } : {}) }, pagination: { limit: 10 } } }, fetchImpl);
  return json ? parseOffers(json, opts.maxCents, opts.exclude) : [];
}

/**
 * The first of these products that can actually reach this address, as a checkout ready to pay: the real total with
 * tax and the shop's own pay page. Tries up to `tries` shops (a local florist that can't deliver there is skipped).
 */
export async function readyOrder(query: string, to: Recipient, opts: { maxCents?: number | null; intent?: string; tries?: number; email?: string | null; exclude?: RegExp } = {}, fetchImpl: typeof fetch = fetch): Promise<ReadyOrder | null> {
  const offers = await searchOffers(query, { postalCode: to.postal_code, maxCents: opts.maxCents, intent: opts.intent, exclude: opts.exclude }, fetchImpl);
  const seen = new Set<string>();
  let tried = 0;
  for (const o of offers) {
    if (seen.has(o.shop) || tried >= (opts.tries ?? 3)) continue;
    seen.add(o.shop); tried++;
    const json = await call('create_checkout', {
      shop: o.shop,
      meta: { 'idempotency-key': crypto.randomUUID() },
      checkout: {
        line_items: [{ item: { id: o.variantId }, quantity: 1 }],
        ...(opts.email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(opts.email) ? { buyer: { email: opts.email } } : {}),
        fulfillment: { methods: [{ type: 'shipping', destinations: [{ type: 'shipping_address', ...to }] }] },
      },
    }, fetchImpl, 12000);
    const co = json?.result?.structuredContent;
    if (blockedReason(co)) continue;
    const total = totalOf(co) ?? o.priceCents;
    return {
      title: o.title, seller: o.seller, image: o.image, url: co.continue_url,
      price: money(o.priceCents), total: money(total), totalCents: total, deliversTo: oneLine(to), ready: true,
    };
  }
  return null;
}
