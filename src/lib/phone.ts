// A phone number in +country format, written the way people in that country write it. Unknown countries fall back
// to "+CC" and the rest in groups of three or four, which is still easy to read and dial.

type Rule = [cc: string, local: (n: string) => string | null];
const g = (n: string, ...sizes: number[]) => { const out: string[] = []; let i = 0; for (const s of sizes) { out.push(n.slice(i, i + s)); i += s; } if (i < n.length) out.push(n.slice(i)); return out.filter(Boolean).join(' '); };

const RULES: Rule[] = [
  ['1', n => n.length === 10 ? `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}` : null],            // US, Canada
  ['852', n => n.length === 8 ? g(n, 4, 4) : null],                                                     // Hong Kong
  ['853', n => n.length === 8 ? g(n, 4, 4) : null],                                                     // Macau
  ['886', n => n.length === 9 ? (n[0] === '9' ? g(n, 3, 3, 3) : g(n, 1, 4, 4)) : null],               // Taiwan
  ['86', n => n.length === 11 && n[0] === '1' ? g(n, 3, 4, 4) : n.length >= 9 ? (/^(10|2\d)/.test(n) ? g(n, 2, 4, 4) : g(n, 3, 4, 4)) : null], // China
  ['65', n => n.length === 8 ? g(n, 4, 4) : null],                                                      // Singapore
  ['61', n => n.length === 9 ? (n[0] === '4' ? g(n, 3, 3, 3) : g(n, 1, 4, 4)) : null],                // Australia
  ['64', n => n.length >= 8 ? (n[0] === '2' ? g(n, 2, 3, 4) : g(n, 1, 3, 4)) : null],                  // New Zealand
  ['44', n => n.length === 10 ? (n[0] === '7' ? g(n, 4, 6) : n[0] === '2' ? g(n, 2, 4, 4) : g(n, 4, 6)) : null], // UK
  ['353', n => n.length >= 8 ? (n[0] === '8' ? g(n, 2, 3, 4) : g(n, 1, 3, 4)) : null],                // Ireland
  ['33', n => n.length === 9 ? g(n, 1, 2, 2, 2, 2) : null],                                            // France
  ['49', n => n.length >= 9 ? (n[0] === '1' ? g(n, 3, 8) : g(n, n.startsWith('30') || n.startsWith('40') || n.startsWith('89') ? 2 : 3, 12)) : null], // Germany
  ['34', n => n.length === 9 ? g(n, 3, 3, 3) : null],                                                   // Spain
  ['39', n => n.length >= 9 ? (n[0] === '3' ? g(n, 3, 3, 4) : g(n, 2, 4, 4)) : null],                  // Italy
  ['31', n => n.length === 9 ? (n[0] === '6' ? g(n, 1, 8) : g(n, 2, 7)) : null],                       // Netherlands
  ['32', n => n.length >= 8 ? (n[0] === '4' ? g(n, 3, 2, 2, 2) : g(n, 1, 3, 2, 2)) : null],            // Belgium
  ['351', n => n.length === 9 ? g(n, 3, 3, 3) : null],                                                  // Portugal
  ['41', n => n.length === 9 ? g(n, 2, 3, 2, 2) : null],                                               // Switzerland
  ['43', n => n.length >= 9 ? g(n, n[0] === '6' ? 3 : 1, 12) : null],                                  // Austria
  ['45', n => n.length === 8 ? g(n, 2, 2, 2, 2) : null],                                               // Denmark
  ['46', n => n.length >= 8 ? (n[0] === '7' ? g(n, 2, 3, 2, 2) : g(n, 1, 3, 2, 2)) : null],            // Sweden
  ['47', n => n.length === 8 ? g(n, 3, 2, 3) : null],                                                  // Norway
  ['358', n => n.length >= 7 ? g(n, 2, 3, 4) : null],                                                  // Finland
  ['48', n => n.length === 9 ? g(n, 3, 3, 3) : null],                                                  // Poland
  ['30', n => n.length === 10 ? g(n, 3, 3, 4) : null],                                                 // Greece
  ['55', n => n.length === 11 ? `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}` : n.length === 10 ? `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}` : null], // Brazil
  ['54', n => n.length >= 10 ? (n[0] === '9' ? g(n, 1, 2, 4, 4) : g(n, 2, 4, 4)) : null],              // Argentina
  ['56', n => n.length === 9 ? g(n, 1, 4, 4) : null],                                                  // Chile
  ['57', n => n.length === 10 ? g(n, 3, 3, 4) : null],                                                 // Colombia
  ['51', n => n.length === 9 ? g(n, 3, 3, 3) : null],                                                  // Peru
  ['58', n => n.length === 10 ? g(n, 3, 3, 4) : null],                                                 // Venezuela
  ['593', n => n.length === 9 ? g(n, 2, 3, 4) : null],                                                 // Ecuador
  ['598', n => n.length === 8 ? g(n, 1, 3, 4) : null],                                                 // Uruguay
  ['52', n => n.length === 10 ? g(n, 2, 4, 4) : null],                                                 // Mexico
  ['81', n => n.length >= 9 ? (/^[789]0/.test(n) ? g(n, 2, 4, 4) : g(n, n[0] === '3' || n[0] === '6' ? 1 : 2, 4, 4)) : null], // Japan
  ['82', n => n.length >= 9 ? (n.startsWith('10') ? g(n, 2, 4, 4) : g(n, n[0] === '2' ? 1 : 2, 3, 4)) : null], // South Korea
  ['91', n => n.length === 10 ? g(n, 5, 5) : null],                                                    // India
  ['971', n => n.length === 9 ? g(n, 2, 3, 4) : null],                                                 // UAE
];

/** "+85291234567" → "+852 9123 4567"; "+14085550134" → "(408) 555-0134" (US and Canada read as local). */
export function prettyPhone(e164: string): string {
  const d = String(e164 || '').replace(/[^\d+]/g, '');
  if (!/^\+\d{7,15}$/.test(d)) return e164;
  const digits = d.slice(1);
  for (const [cc, local] of [...RULES].sort((a, b) => b[0].length - a[0].length)) {
    if (!digits.startsWith(cc)) continue;
    const rest = local(digits.slice(cc.length));
    if (rest) return cc === '1' ? rest : `+${cc} ${rest}`;
  }
  // Unknown: country code (1 to 3 digits, best guess 2), then groups of three and four
  const cc = digits.slice(0, 2), rest = digits.slice(2);
  return `+${cc} ${rest.replace(/(\d{3,4})(?=\d{3,})/g, '$1 ')}`;
}
