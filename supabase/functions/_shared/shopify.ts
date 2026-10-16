// Shopify's Global Catalog: products from independent Shopify brands, each with a checkout link that opens the
// merchant's own checkout (Shop Pay) with the item already in the cart. Belluh finds and gets it ready; the person pays.
// Docs: https://shopify.dev/docs/agents/catalog/global-catalog. Pure parsing is unit-tested; the fetch has a short
// timeout and any failure just means no Shopify results (the other stores still show).

export interface ShopProduct { title: string; price: string; seller: string; image: string | null; url: string }

const env = (k: string) => { try { return (globalThis as any).Deno?.env.get(k) ?? undefined; } catch { return undefined; } };
const CATALOG_URL = () => env('SHOPIFY_CATALOG_URL') || 'https://catalog.shopify.com/api/ucp/mcp';
// Belluh's agent profile (public/ucp/agent-profile.json on belluh.com), sent with every request as Shopify asks
const PROFILE_URL = () => env('SHOPIFY_AGENT_PROFILE') || 'https://www.belluh.com/ucp/agent-profile.json';

const money = (minor: number, currency: string) => {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: minor % 100 ? 2 : 0 }).format(minor / 100); }
  catch { return `${(minor / 100).toFixed(2)} ${currency}`; }
};

/** Shopify's search response, cut down to what Belluh shows: in-stock products in dollars, each with a checkout link. */
export function parseCatalog(json: unknown, currency = 'USD', limit = 3): ShopProduct[] {
  const products = ((json as any)?.result?.structuredContent?.products ?? []) as any[];
  const out: ShopProduct[] = [];
  for (const p of products) {
    const v = (Array.isArray(p?.variants) ? p.variants : []).find((x: any) => typeof x?.checkout_url === 'string' && /^https:\/\//.test(x.checkout_url));
    const min = p?.price_range?.min;
    if (!v || typeof p?.title !== 'string' || !min || min.currency !== currency || !(Number(min.amount) > 0)) continue;
    const img = (Array.isArray(p.media) ? p.media : []).find((m: any) => typeof m?.url === 'string' && /^https:\/\//.test(m.url))?.url ?? null;
    out.push({
      title: p.title.replace(/\s+/g, ' ').trim().slice(0, 90),
      price: money(Number(min.amount), currency),
      seller: String(v.seller?.name || v.seller?.domain || new URL(v.checkout_url).hostname).slice(0, 40),
      image: img,
      url: v.checkout_url,
    });
    if (out.length >= limit) break;
  }
  return out;
}

/** Search every Shopify brand for this item, under a budget in dollars if given. */
export async function searchShopify(query: string, maxDollars?: number | null, limit = 3, fetchImpl: typeof fetch = fetch): Promise<ShopProduct[]> {
  const q = query.replace(/\s+/g, ' ').trim().slice(0, 100);
  if (q.length < 2) return [];
  const filters: Record<string, unknown> = { ships_to: { country: 'US' }, available: true };
  if (maxDollars && maxDollars > 0) filters.price = { max: Math.round(maxDollars * 100) };
  const body = {
    jsonrpc: '2.0', method: 'tools/call', id: 1,
    params: { name: 'search_catalog', arguments: { meta: { 'ucp-agent': { profile: PROFILE_URL() } }, catalog: { query: q, filters, context: { address_country: 'US' }, pagination: { limit: 10 } } } },
  };
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 6000);
  try {
    const r = await fetchImpl(CATALOG_URL(), { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(body), signal: ctl.signal });
    if (!r.ok) return [];
    return parseCatalog(await r.json(), 'USD', limit);
  } catch { return []; } finally { clearTimeout(t); }
}
