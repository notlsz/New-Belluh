import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prettyPhone } from '../src/lib/phone.ts';
import { toE164 } from '../supabase/functions/_shared/vapi.ts';
import { smsE164 } from '../supabase/functions/_shared/sms.ts';

test('phone numbers read the local way in every region Belluh serves', () => {
  const cases: [string, string][] = [
    ['+14085550134', '(408) 555-0134'],          // US
    ['+8613812345678', '+86 138 1234 5678'],      // China mobile
    ['+862161234567', '+86 21 6123 4567'],        // Shanghai landline
    ['+85291234567', '+852 9123 4567'],           // Hong Kong
    ['+6581234567', '+65 8123 4567'],             // Singapore
    ['+61412345678', '+61 412 345 678'],          // Australia mobile
    ['+61291234567', '+61 2 9123 4567'],          // Sydney landline
    ['+442071234567', '+44 20 7123 4567'],        // London
    ['+33142685300', '+33 1 42 68 53 00'],        // Paris
    ['+4915112345678', '+49 151 12345678'],       // Germany mobile
    ['+34912345678', '+34 912 345 678'],          // Madrid
    ['+393123456789', '+39 312 345 6789'],        // Italy mobile
    ['+31612345678', '+31 6 12345678'],           // Netherlands mobile
    ['+5511912345678', '+55 (11) 91234-5678'],    // São Paulo mobile
    ['+5491123456789', '+54 9 11 2345 6789'],     // Buenos Aires mobile
    ['+56912345678', '+56 9 1234 5678'],          // Chile
    ['+573001234567', '+57 300 123 4567'],        // Colombia
    ['+51912345678', '+51 912 345 678'],          // Peru
  ];
  for (const [n, want] of cases) assert.equal(prettyPhone(n), want, n);
  assert.match(prettyPhone('+3725123456'), /^\+37 25123456$|^\+37 2512 3456$/, 'unknown countries still read in groups');
});

test('international numbers are accepted for calls and texts', () => {
  assert.equal(toE164('+852 9123 4567'), '+85291234567');
  assert.equal(toE164('+86 138 1234 5678'), '+8613812345678');
  assert.equal(toE164('+61 2 9123 4567'), '+61291234567');
  assert.equal(toE164('+55 11 91234-5678'), '+5511912345678');
  assert.equal(smsE164('+65 8123 4567'), '+6581234567');
  assert.equal(smsE164('+44 20 7123 4567'), '+442071234567');
});
