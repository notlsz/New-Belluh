// The pages behind the footer, one for each resource and policy a company like Belluh owes the people who use it:
// newsroom, your stories, contact, safety, FAQ, trust and safety, press, how Belluh works, the not-so-frequent
// questions, security, cookies, consumer health data, your privacy choices, accessibility. All in Belluh's own words,
// and only what is true of Belluh today. Policies point to the Privacy Policy and Terms, which govern.
import React from 'react';
import { useI18n } from '../../i18n';
import { Shell, Wrap, Eyebrow, Big, Body, Reveal, Pill, go, BLUE, type PageProps } from './kit';

const HELLO = 'elizabeth@belluh.com', PRIVACY = 'privacy@belluh.com';
type Part = { h?: string; p?: string[]; list?: string[]; links?: { label: string; href?: string; to?: string }[] };
type Doc = { eyebrow: string; title: string; lede: string; updated?: string; parts: Part[]; cta?: { label: string; href?: string; to?: string } };
const mail = (to: string, subject: string) => `mailto:${to}?subject=${encodeURIComponent(subject)}`;
const UPDATED = 'November 1, 2026';

export const DOCS: Record<string, Doc> = {
  newsroom: {
    eyebrow: 'Newsroom', title: 'What’s new at Belluh.', lede: 'Product news and announcements, newest first. For interviews and press questions, see Press resources.',
    parts: [
      { h: 'November 2026: Your profile, your way', p: ['Profiles became a blank canvas. Record Your Face, a few looping seconds of you cut out from the background, and use it as your picture. Add songs, books, movies, voice notes, drawings, shapes and stickers anywhere, with decorations and effects that move.'] },
      { h: 'November 2026: Belluh Research', p: ['We published the science behind Belluh: what we study, how we work, and six peer-reviewed studies on what keeps couples close.'], links: [{ label: 'Visit Belluh Research', to: '/research' }] },
      { h: 'October 2026: Guides worth sharing', p: ['Couples can turn the places they love into guides, kept private, shared with friends by link, or posted for every couple.'] },
      { h: 'October 2026: Your love map', p: ['Every memory pinned where it happened, on a map that zooms all the way out to the planets.'] },
    ],
    cta: { label: 'Press resources', to: '/press' },
  },
  stories: {
    eyebrow: 'Success stories', title: 'Did Belluh help your love last?', lede: 'The anniversary you almost forgot and didn’t. The date that turned into a tradition. The note that said the right thing. We’d love to hear it.',
    parts: [
      { h: 'Tell us your story', p: ['Write to us with your names (first names are fine), how long you’ve been together, and the moment Belluh was part of. Photos are welcome.', 'We will always ask both of you before we share anything, and we never share a story without your permission.'] },
    ],
    cta: { label: 'Share your story', href: mail(HELLO, 'Our Belluh story') },
  },
  contact: {
    eyebrow: 'Contact', title: 'Talk to a human.', lede: 'Belluh is a small team. Write to us and a person will read it.',
    parts: [
      { h: 'Help with the app', p: ['Ask Bella first: she knows how everything works. If she can’t help, write to us.'], links: [{ label: HELLO, href: mail(HELLO, 'Help') }] },
      { h: 'Privacy and your data', p: ['Requests to see, download, correct or delete your data.'], links: [{ label: PRIVACY, href: mail(PRIVACY, 'Privacy request') }] },
      { h: 'Press, partnerships and careers', links: [{ label: 'Press resources', to: '/press' }, { label: 'Belluh Together', to: '/impact' }, { label: 'Careers', to: '/careers' }] },
    ],
  },
  'safety-tips': {
    eyebrow: 'Safety', title: 'Love should feel safe.', lede: 'Belluh is for keeping love close. Here is what healthy looks like, what doesn’t, and where to turn.',
    parts: [
      { h: 'Healthy looks like', list: ['You can say no, and it is respected.', 'You keep your own friends, money, phone and time.', 'Disagreements end without fear.', 'You both feel free to be yourselves.'] },
      { h: 'Warning signs', list: ['Checking your phone, location or messages without asking.', 'Cutting you off from friends or family.', 'Controlling money, or what you wear or do.', 'Threats, put-downs, or making you afraid.'] },
      { h: 'Your Belluh, your boundaries', p: ['Every entry is shared or private, your call. Your partner never sees your private entries. You can leave a circle at any time.'] },
      { h: 'Get help now', p: ['If you are in danger, call your local emergency number. In the U.S., call 911.', 'National Domestic Violence Hotline (U.S.): call 1-800-799-7233 or text START to 88788. It is free and confidential, any time.', '988 Suicide & Crisis Lifeline (U.S.): call or text 988.', 'Outside the U.S., your local emergency number and local support services can help.'] },
    ],
  },
  faq: { eyebrow: 'FAQ', title: 'Questions, answered.', lede: 'The questions couples ask us most.', parts: [] },
  'trust-and-safety': {
    eyebrow: 'Trust & Safety', title: 'Built to be trusted with your love story.', lede: 'Your journal holds the most personal things you will ever write down. Here is how we look after it, and how we keep Belluh kind.',
    parts: [
      { h: 'Private by default', p: ['Every entry is shared or private, your call. Your partner never sees your private entries, and neither does Bella when she talks with them.'] },
      { h: 'You choose what goes public', p: ['Guides are private until you decide otherwise: you can keep a guide to yourselves, share it with friends by link, or post it for every couple. You can change your mind any time.'] },
      { h: 'Keeping the community kind', p: ['Guides posted for everyone must be about real places and written in good faith. No hate, harassment, sexual content, scams or other people’s private information.'], },
      { h: 'Report something', p: ['If you see a guide or anything else on Belluh that breaks these rules, or someone is using Belluh to hurt you, tell us. We read every report.'], links: [{ label: 'Report to Belluh', href: mail(HELLO, 'Report') }, { label: 'Safety tips and help', to: '/safety-tips' }] },
    ],
  },
  press: {
    eyebrow: 'Press resources', title: 'Writing about Belluh?', lede: 'Everything you need, and a person to talk to.',
    parts: [
      { h: 'About Belluh', p: ['Belluh is a shared AI journal for couples. Bella, its AI, remembers what matters to you both, plans dates your partner can accept with one tap, and reminds you before the days that count, so busy couples stay close. Belluh is free to start and available in eight languages.'] },
      { h: 'Brand', p: ['Name: Belluh, always with a capital B. The AI is Bella.', 'Colors: Belluh blue #9BBECB and Belluh pink #F0ADDD.'], links: [{ label: 'Download the mark (PNG)', href: '/dragonfly.png' }, { label: 'Download the app icon (PNG)', href: '/icon-512.png' }] },
      { h: 'Press contact', links: [{ label: HELLO, href: mail(HELLO, 'Press') }] },
    ],
  },
  'how-belluh-works': {
    eyebrow: 'How Belluh works', title: 'How Bella helps you stay close.', lede: 'No magic, no mystery. Here is what Bella looks at, and what she does with it.',
    parts: [
      { h: 'What Bella knows', p: ['Only what you give Belluh: what you write in your journal, the dates and details you save, and your calendar if you connect it. Your private entries stay private, even from Bella when she talks with your partner.'] },
      { h: 'What Bella does with it', list: ['Remembers the details, like their coffee order or the restaurant from your third date.', 'Reminds you before birthdays and anniversaries.', 'Suggests plans and dates your partner can accept with one tap.', 'Every Sunday, gives you one insight and one small thing to try together.'] },
      { h: 'You decide', p: ['Bella suggests. You choose. Say no to a plan and she learns what you like.'] },
      { h: 'Grounded in research', p: ['What Bella suggests is built on decades of relationship science.'], links: [{ label: 'Visit Belluh Research', to: '/research' }] },
    ],
  },
  nfaq: {
    eyebrow: 'NFAQ', title: 'Not-so frequently asked questions.', lede: 'Things nobody asks, answered anyway.',
    parts: [
      { h: 'Why is the logo a dragonfly?', p: ['Dragonflies are light, quick, and turn up when the day is warm. That’s the feeling we want Belluh to leave behind.'] },
      { h: 'Who is Bella?', p: ['Belluh’s AI. She remembers what you’d forget, plans what you’d put off, and never takes sides.'] },
      { h: 'Can Bella settle who’s right?', p: ['No. She never takes sides. She might suggest dinner, though.'] },
      { h: 'Does Belluh work if we live in different time zones?', p: ['Yes. Belluh keeps each of your time zones, so reminders land at the right hour for both of you.'] },
      { h: 'What’s the most romantic thing Belluh can do?', p: ['Remember something your partner said once, months ago, at exactly the right moment.'] },
    ],
  },
  security: {
    eyebrow: 'Security', title: 'How we protect your data.', lede: 'Security at Belluh, in plain words.', updated: UPDATED,
    parts: [
      { h: 'Who can see what', p: ['Database rules decide who can read each piece of data: your journal is readable only by the people in your circle, and private entries only by you. These rules run on the server, not just in the app.'] },
      { h: 'Photos and voice notes', p: ['Your photos and voice notes are kept in private storage. The app shows them using links that expire shortly after they are made, so a copied link stops working.'] },
      { h: 'In transit and at rest', p: ['Belluh is served only over HTTPS. Passwords are handled by our authentication provider and are never stored in plain text. Payments are handled by third-party payment processors; we do not store full card numbers.'] },
      { h: 'Report a vulnerability', p: ['If you believe you’ve found a security issue, please email us before sharing it publicly, with steps to reproduce it. We will respond, keep you updated, and credit you if you’d like.'], links: [{ label: 'Report a security issue', href: mail(HELLO, 'Security report') }] },
    ],
  },
  cookies: {
    eyebrow: 'Cookie policy', title: 'Cookies and similar storage.', lede: 'What Belluh stores in your browser, and why.', updated: UPDATED,
    parts: [
      { h: 'What we store', list: ['Sign-in: keeps you signed in on this device.', 'Your settings: things like your language, time zone and whether the sidebar is open.', 'Things in progress: an invite you followed, or a question you started before signing in, so it’s still there after you sign in.'] },
      { h: 'Why', p: ['These are needed for Belluh to work, or to remember your choices. The Privacy Policy explains everything else we collect, including usage and analytics data, and how we use it.'] },
      { h: 'Your choices', p: ['You can clear site data in your browser settings at any time. If you do, you’ll be signed out and your on-device settings will reset.'] },
    ],
  },
  'consumer-health-data': {
    eyebrow: 'Consumer health data privacy policy', title: 'Health information you choose to share.', lede: 'Some U.S. states, such as Washington, give you specific rights over consumer health data. This page explains how that applies to Belluh.', updated: UPDATED,
    parts: [
      { h: 'What this covers', p: ['Belluh is not a medical service. But what you write in your journal, how you feel, how you’re sleeping, a doctor’s visit you mention, could include information about your health. This page covers that information.'] },
      { h: 'How we use it', p: ['Only to run Belluh for you: to keep your journal, and for Bella to help you as described in the Privacy Policy. Private entries stay private, including from your partner.'] },
      { h: 'Your rights', list: ['Know what health information we have about you.', 'Get a copy of it.', 'Have it deleted.', 'Withdraw your consent to our using it.'], },
      { h: 'How to ask', p: ['Email us. We will confirm it’s you, and respond within the time the law requires.'], links: [{ label: PRIVACY, href: mail(PRIVACY, 'Consumer health data request') }] },
    ],
  },
  'privacy-choices': {
    eyebrow: 'Your privacy choices', title: 'Your data, your choices.', lede: 'What you can do with your information, and how.', updated: UPDATED,
    parts: [
      { h: 'Choose what’s shared', p: ['Every entry is shared or private, your call. Guides can be private, shared by link, or posted for everyone, and you can change that at any time.'] },
      { h: 'See, download, correct or delete', p: ['You can ask for a copy of your journal entries, photos and relationship data, ask us to correct it, or ask us to delete your account and data. We respond within 30 days of verifying it’s you.'], links: [{ label: 'Make a request', href: mail(PRIVACY, 'Data request') }] },
      { h: 'Opt out', p: ['If you don’t want us to use your information for a purpose the law lets you opt out of, tell us and we will honor it.'], links: [{ label: 'Opt out', href: mail(PRIVACY, 'Opt-out request') }] },
    ],
  },
  accessibility: {
    eyebrow: 'Accessibility statement', title: 'Belluh, for everyone.', lede: 'Love isn’t only for people who can use a mouse. We want Belluh to work for every couple.', updated: UPDATED,
    parts: [
      { h: 'What we do', list: ['Respect your device’s reduced-motion setting: animations and effects stop.', 'Label buttons and images for screen readers.', 'Work with a keyboard, and close menus and dialogs with Escape.', 'Speak eight languages, in local formats.'] },
      { h: 'Our aim', p: ['We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. We’re not perfect yet, and we’re working on it.'] },
      { h: 'Tell us', p: ['If something in Belluh is hard to use, please tell us. We read every note.'], links: [{ label: 'Report an accessibility problem', href: mail(HELLO, 'Accessibility') }] },
    ],
  },
};
export const SLUGS = Object.keys(DOCS);

const LinkRow: React.FC<{ l: { label: string; href?: string; to?: string } }> = ({ l }) => l.to
  ? <button onClick={() => go(l.to!)} className="text-[16px] font-semibold underline underline-offset-4 hover:opacity-60">{l.label}</button>
  : <a href={l.href} className="text-[16px] font-semibold underline underline-offset-4 hover:opacity-60">{l.label}</a>;

const ResourcePage: React.FC<PageProps & { slug: string }> = ({ slug, ...p }) => {
  const { d } = useI18n();
  const doc = DOCS[slug] ?? DOCS.contact;
  const parts: Part[] = slug === 'faq' ? d.faq.items.map(x => ({ h: x.q, p: [x.a] })) : doc.parts;
  return (
    <Shell {...p} title={doc.eyebrow}>
      <section className="pt-16 md:pt-28 pb-24 md:pb-32">
        <Wrap className="max-w-[1040px]">
          <Reveal>
            <Eyebrow>{doc.eyebrow}</Eyebrow>
            <Big as="h1" className="font-bold max-w-[18ch]">{doc.title}</Big>
            <Body className="mt-6 text-[19px] text-[#1a1a1a]/75 max-w-[640px]">{doc.lede}</Body>
            {doc.updated && <p className="mt-4 text-[13px]" style={{ color: BLUE }}>Last updated {doc.updated}</p>}
          </Reveal>
          <div className="mt-16 md:mt-20 space-y-12 md:space-y-14">
            {parts.map((x, i) => (
              <Reveal key={i} delay={Math.min(i, 4) * 60}>
                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-3 md:gap-12">
                  {x.h && <h2 className="font-serif text-[1.6rem] md:text-[1.75rem] leading-snug tracking-tight">{x.h}</h2>}
                  <div className="space-y-4 max-w-[620px]">
                    {x.p?.map((t, k) => <Body key={k} className="text-[#1a1a1a]/80">{t}</Body>)}
                    {x.list && <ul className="space-y-3">{x.list.map(t => <li key={t} className="text-[17px] leading-[1.6] text-[#1a1a1a]/80">{t}</li>)}</ul>}
                    {x.links && <div className="flex flex-wrap gap-x-6 gap-y-2">{x.links.map(l => <LinkRow key={l.label} l={l} />)}</div>}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          {doc.cta && <div className="mt-16">{doc.cta.to ? <Pill onClick={() => go(doc.cta!.to!)}>{doc.cta.label}</Pill> : <Pill href={doc.cta.href}>{doc.cta.label}</Pill>}</div>}
          {doc.updated && <p className="mt-16 text-[14px] text-[#1a1a1a]/60">This page explains how things work in plain words. The <button onClick={() => p.onShowLegal('privacy')} className="underline underline-offset-2">Privacy Policy</button> and <button onClick={() => p.onShowLegal('tos')} className="underline underline-offset-2">Terms of Service</button> govern.</p>}
        </Wrap>
      </section>
    </Shell>
  );
};

export default ResourcePage;
