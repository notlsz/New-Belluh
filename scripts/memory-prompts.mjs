// Regenerates src/lib/memory/data/prompts.txt: the text embeddings of Belluh Memory's vocabulary (labels and sensitive
// prompts) with the same model and precision the browser uses (Xenova/mobileclip_s0, q8 text tower).
// Run after changing src/lib/memory/vocab.ts:  NODE_USE_ENV_PROXY=1 node --experimental-strip-types scripts/memory-prompts.mjs
import fs from 'node:fs';
import { AutoTokenizer, CLIPTextModelWithProjection } from '@huggingface/transformers';
import { labelPrompts, sensitivePrompts, vocabKey, encodePrompts } from '../src/lib/memory/prompts.ts';
import { MODEL_ID } from '../src/lib/memory/constants.ts';

const tok = await AutoTokenizer.from_pretrained(MODEL_ID);
const model = await CLIPTextModelWithProjection.from_pretrained(MODEL_ID, { dtype: 'q8' });
const prompts = [...labelPrompts(), ...sensitivePrompts()];
let dim = 0; const parts = [];
for (let i = 0; i < prompts.length; i += 32) {
  const { text_embeds } = await model(tok(prompts.slice(i, i + 32), { padding: 'max_length', truncation: true }));
  dim = text_embeds.dims[1];
  for (let j = 0; j < text_embeds.dims[0]; j++) {
    const v = Float32Array.from(text_embeds.data.slice(j * dim, (j + 1) * dim));
    const n = Math.hypot(...v); parts.push(v.map(x => x / n));
  }
}
const rows = new Float32Array(parts.length * dim); parts.forEach((v, i) => rows.set(v, i * dim));
const out = new URL('../src/lib/memory/data/prompts.txt', import.meta.url);
fs.writeFileSync(out, encodePrompts(vocabKey(), dim, rows) + '\n');
console.log(`${parts.length} prompts, ${dim} dims, key ${vocabKey()}: ${out.pathname}`);
