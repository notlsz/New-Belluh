// Groceries as one cart: Instacart's Developer Platform turns Belluh's list into a single page with every item on it,
// so they pick a store and check out once instead of adding items one by one.
// Docs: https://docs.instacart.com/developer_platform_api/api/products/create_shopping_list_page

const env = (k: string) => { try { return (globalThis as any).Deno?.env.get(k) ?? undefined; } catch { return undefined; } };

/** One Instacart link holding the whole list, or null (no key, or Instacart didn't answer) so the per-item links stay. */
export async function instacartCart(title: string, items: string[], fetchImpl: typeof fetch = fetch): Promise<string | null> {
  const key = env('INSTACART_API_KEY');
  if (!key || !items.length) return null;
  try {
    const r = await fetchImpl(`${env('INSTACART_API_BASE') || 'https://connect.instacart.com'}/idp/v1/products/products_link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        title: title.slice(0, 80),
        link_type: 'shopping_list',
        expires_in: 30,
        line_items: items.slice(0, 20).map(name => ({ name, display_text: name })),
        landing_page_configuration: { partner_linkback_url: 'https://belluh.com' },
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) { console.error('Instacart list failed', r.status); return null; }
    const url = (await r.json())?.products_link_url;
    return typeof url === 'string' && /^https:\/\/[^/]*instacart\.com\//.test(url) ? url : null;
  } catch (e) {
    console.error('Instacart list failed', e);
    return null;
  }
}
