import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { twilioSignature, verifyTwilioSignature, smsE164, smsBody, smsReminder } from '../supabase/functions/_shared/sms.ts';

const URL_ = 'https://x.supabase.co/functions/v1/sms-webhook';
const params = { From: '+15551230000', Body: 'LIST', MessageSid: 'SM123', To: '+15550001111' };
const reference = (token: string) => crypto.createHmac('sha1', token)
  .update(URL_ + Object.keys(params).sort().map(k => k + (params as Record<string, string>)[k]).join('')).digest('base64');

test("Twilio signatures: matches Twilio's documented scheme; forged, altered or unsigned requests fail", async () => {
  assert.equal(await twilioSignature(URL_, params, 'tok'), reference('tok'));
  assert.equal(await verifyTwilioSignature(URL_, params, reference('tok'), 'tok'), true);
  assert.equal(await verifyTwilioSignature(URL_, params, reference('other'), 'tok'), false);
  assert.equal(await verifyTwilioSignature(URL_, { ...params, Body: 'FORGET all' }, reference('tok'), 'tok'), false);
  assert.equal(await verifyTwilioSignature(URL_, params, null, 'tok'), false);
  assert.equal(await verifyTwilioSignature(URL_, params, reference(''), ''), false, 'no token configured means nothing gets in');
});

test('SMS numbers, length and the reminder wording', () => {
  assert.equal(smsE164('+1 (555) 123-0000'), '+15551230000');
  assert.equal(smsE164('12'), null);
  assert.ok(smsBody('x'.repeat(2000)).length <= 600);
  assert.equal(smsReminder(["Dan's birthday", 'in one week', 'October 20', 'Mar 3, 2026']),
    "Belluh reminder: Dan's birthday is in one week, October 20. You first told me about it on Mar 3, 2026. Reply STOP to pause reminders.");
});
