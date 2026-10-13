// Runs a Supabase edge function on the port given in PORT
const orig = Deno.serve.bind(Deno);
(Deno as any).serve = (handler: any) => orig({ port: Number(Deno.env.get('PORT')), onListen: () => console.log('fn on', Deno.env.get('PORT')) }, handler);
await import(Deno.env.get('FN_PATH')!);
