// A small ZIP reader for the data exports dating apps email out ("download my data"), so the file is opened on this
// device and never uploaded. Reads the central directory, then inflates only the entries asked for with the browser's
// own DecompressionStream (deflate-raw). Stored and deflated entries only; ZIP64 and encrypted archives are refused,
// which these exports don't use. Pure apart from DecompressionStream, so it's unit-tested in Node.

export interface ZipEntry { name: string; size: number; read(): Promise<Uint8Array> }

const SIG_EOCD = 0x06054b50, SIG_CEN = 0x02014b50, SIG_LOC = 0x04034b50;
/** Exports are a few MB; a bigger entry than this is not a chat export and is skipped rather than inflated */
export const MAX_ENTRY = 64 * 1024 * 1024;

export const isZip = (b: Uint8Array) => b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export function listZip(buf: Uint8Array): ZipEntry[] {
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  // The end-of-central-directory record sits in the last 64 KB (a comment can follow it)
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (v.getUint32(i, true) === SIG_EOCD) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip');
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  if (p === 0xffffffff || count === 0xffff) throw new Error('zip64');
  const out: ZipEntry[] = [];
  const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (p + 46 > buf.length || v.getUint32(p, true) !== SIG_CEN) throw new Error('bad zip');
    const flags = v.getUint16(p + 8, true), method = v.getUint16(p + 10, true);
    const csize = v.getUint32(p + 20, true), usize = v.getUint32(p + 24, true);
    const nlen = v.getUint16(p + 28, true), xlen = v.getUint16(p + 30, true), clen = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const name = dec.decode(buf.subarray(p + 46, p + 46 + nlen));
    p += 46 + nlen + xlen + clen;
    if (name.endsWith('/') || (flags & 1) || (method !== 0 && method !== 8) || usize > MAX_ENTRY) continue;
    out.push({
      name, size: usize,
      async read() {
        if (v.getUint32(local, true) !== SIG_LOC) throw new Error('bad zip');
        const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
        const data = buf.subarray(start, start + csize);
        return method === 0 ? data.slice() : inflateRaw(data);
      },
    });
  }
  return out;
}
