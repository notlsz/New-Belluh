

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Lock, Menu, X, ChevronDown, Heart, MessageCircle, CalendarCheck, Plus, Check, Gift } from 'lucide-react';
import { Receipt } from './About';
import { rememberCta } from '../services/analytics';
import BelluhOrb from '../components/BelluhOrb';
import BelluhSpeech from '../components/BelluhSpeech';
import LandingDemos from '../components/LandingDemos';
import SiteFooter from '../components/SiteFooter';
import SiteNav from '../components/SiteNav';
import DragonflyMark from '../components/DragonflyMark';
import { belluh, type BelluhState } from '../lib/belluhPresence';
import { ORGANIZATIONS } from '../constants';

const FAQ = [
  { q: 'Can my partner read my private entries?', a: 'No. Every entry is shared or private, your call. Your partner never sees your private entries, and neither does their Belluh.' },
  { q: "We're already busy. Isn't this one more thing to keep up with?", a: "It's the opposite. Write one line a day, or none at all. Belluh does the remembering, the planning and the reminding, so neither of you has to keep track." },
  { q: 'What does Belluh actually do?', a: 'It remembers what matters to you both, plans dates your partner can accept with one tap, and gets things ready to finish in a tap: the date-night table, dinner delivered, the gift, the groceries, a ride, tickets, the honeymoon and the flowers. It reminds you before birthdays and anniversaries, sends the reminders you ask for, helps you find the words for a note, and every Sunday gives you one insight and one small thing to try together.' },
  { q: 'Do we both need to sign up?', a: "Belluh is made for two, so it's best together. You can start on your own and send your partner the link whenever you're ready." },
  { q: 'Is Belluh an AI girlfriend or boyfriend?', a: "No. Belluh doesn't flirt or play a partner. It works for the two of you and points you back to each other." },
  { q: 'Can I use it from WhatsApp or text?', a: "Yes. Connect WhatsApp, SMS or Telegram in Settings with one tap and text Belluh like you'd talk to it in the app. Same Belluh, same memory." },
  { q: 'Why is Belluh made of water?', a: "So you can see what it's doing. It ripples when you type, swirls while it thinks, and moves with every word it says. Ask it to become something, a cat, a lighthouse, the first letter of your name, and it takes that shape." },
  { q: 'What happens to my data?', a: "Your entries are encrypted in storage and in transit, and never sold. Belluh's replies are written by Google's Gemini models, which process your entries to write them." },
  { q: 'Is it free?', a: "Yes. Writing together, your shared memory and a few chats with Belluh a week are free for good. Duo is $7.77 a month or $88.88 a year, one price for the two of you." },
  { q: 'Can I give Belluh to a couple?', a: "Yes. Give a year of Duo for $88.88 for a wedding, an anniversary or a new home. Pick the day it arrives and we send it to them with your note." },
  { q: 'What happens to our shared memory if we stop paying?', a: "Nothing is lost. Every entry and everything Belluh remembers stays yours, and the free plan keeps all of it." },
];

// Priced from what a couple costs to run, not from what the market will bear: AI for both partners, texting, the odd
// restaurant call and hosting come to roughly $1.80 a month for an active couple and $3.60 for a heavy one. $7.77
// covers the heavy couple with about 80% left over after payment fees, and an average couple at well over that.
/**
 * Give a couple a year of Duo, presented like something worth keeping: a lacquered box in the occasion's colour, an
 * ivory card with gold rules, and a quiet moment of thanks once it's given. Set VITE_GIFT_CHECKOUT_URL to a checkout
 * and the button pays; until then the gift comes to us by email and we send it on by hand.
 */
const GOLD = '#b08d57';
const OCCASIONS = [
  { label: 'Wedding', note: 'For every chapter after the vows. Write it all down, together.', box: '#4a1f30', glow: '#7a3550' },
  { label: 'Anniversary', note: "Here's to another year worth remembering.", box: '#12303a', glow: '#1f5263' },
  { label: 'New home', note: 'New keys, new rooms, new memories. Keep every one.', box: '#1f3326', glow: '#35553f' },
  { label: 'Just because', note: 'You two are my favorite love story.', box: '#2e1f3d', glow: '#4e3566' },
];
const GIFT_CHECKOUT = (import.meta as any).env?.VITE_GIFT_CHECKOUT_URL as string | undefined;

function GiftCard() {
  const [occasion, setOccasion] = React.useState(0);
  const [one, setOne] = React.useState('');
  const [two, setTwo] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [when, setWhen] = React.useState('');
  const [note, setNote] = React.useState<string | null>(null);
  const [writing, setWriting] = React.useState(false);
  const [given, setGiven] = React.useState(false);
  const tone = OCCASIONS[occasion];
  const today = new Date().toISOString().slice(0, 10);
  const shownNote = (note ?? tone.note).trim() || tone.note;
  const names = [one.trim(), two.trim()].filter(Boolean).join(' & ');
  const ready = !!(one.trim() && two.trim() && /^\S+@\S+\.\S+$/.test(email.trim()));
  const opens = when ? new Date(`${when}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : null;
  const body = `For: ${names}\nTheir email: ${email}\nOccasion: ${tone.label}\nSend on: ${opens ?? 'Right away'}\nFrom: ${from}\nNote: ${shownNote}`;
  const href = GIFT_CHECKOUT ? GIFT_CHECKOUT : `mailto:hello@belluh.com?subject=${encodeURIComponent(`A Belluh gift for ${names}`)}&body=${encodeURIComponent(body)}`;
  const line = 'h-12 w-full bg-transparent border-0 border-b border-[#d8cfc0] px-0 text-[16px] text-slate-900 placeholder:text-[#a89d8c] focus:outline-none focus:border-slate-900 transition-colors rounded-none';
  const caps = 'text-[10px] font-semibold uppercase tracking-[0.32em]';
  return (
    <div id="gift" className="relative mt-5 overflow-hidden rounded-[2.5rem] bg-[#f7f3ec] scroll-mt-24" style={{ boxShadow: `inset 0 0 0 1px ${GOLD}33` }}>
      <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-12 lg:gap-14 p-6 md:p-12 lg:p-16 items-center">
        <div className="relative">
          <p className={caps} style={{ color: GOLD }}>The gift</p>
          <h3 className="mt-6 font-serif text-[2.6rem] md:text-[3.4rem] tracking-tight leading-[1.02] text-slate-900">
            Some gifts are opened.<br /><span className="italic" style={{ color: GOLD }}>This one is kept.</span>
          </h3>
          <p className="mt-6 text-[17px] text-[#5f574c] leading-relaxed max-w-md">You're the one who remembers the little things. This is how they will too: a year of Belluh for both of them, every moment written down, every date planned, every anniversary kept.</p>

          {given ? (
            <div className="mt-10 py-10 border-y" style={{ borderColor: `${GOLD}55` }} role="status">
              <p className={caps} style={{ color: GOLD }}>Given</p>
              <p className="mt-4 font-serif text-3xl md:text-4xl text-slate-900 leading-tight">Beautifully done{from.trim() ? `, ${from.trim()}` : ''}.</p>
              <p className="mt-4 text-[17px] text-[#5f574c] leading-relaxed">{names} will open it {opens ? `on ${opens}` : 'soon'}. Years from now, they'll still know who gave it to them.</p>
              {!GIFT_CHECKOUT && <p className="mt-4 text-sm text-[#8a7f70]">Send the email that just opened and we'll take it from there.</p>}
              <button onClick={() => { setGiven(false); setOne(''); setTwo(''); setEmail(''); setWhen(''); setNote(null); setWriting(false); }} className="mt-7 text-sm font-semibold text-slate-900 underline underline-offset-[6px] decoration-1" style={{ textDecorationColor: GOLD }}>Give another</button>
            </div>
          ) : (
            <>
              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3" role="radiogroup" aria-label="Occasion">
                {OCCASIONS.map((o, i) => (
                  <button key={o.label} role="radio" aria-checked={occasion === i} onClick={() => setOccasion(i)}
                    className={`pb-1.5 text-[15px] border-b transition-colors ${occasion === i ? 'text-slate-900 font-semibold' : 'text-[#8a7f70] border-transparent hover:text-slate-900'}`}
                    style={occasion === i ? { borderColor: GOLD } : undefined}>{o.label}</button>
                ))}
              </div>
              <div className="mt-8 space-y-4">
                <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
                  <input value={one} onChange={e => setOne(e.target.value)} placeholder="Maya" autoComplete="off" aria-label="First partner's name" className={line} />
                  <span className="font-serif italic text-2xl pb-2" style={{ color: GOLD }}>&amp;</span>
                  <input value={two} onChange={e => setTwo(e.target.value)} placeholder="Dan" autoComplete="off" aria-label="Second partner's name" className={line} />
                </div>
                <input type="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Their email" autoComplete="off" aria-label="Their email" className={line} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input value={from} onChange={e => setFrom(e.target.value)} placeholder="From" autoComplete="given-name" aria-label="Your name" className={line} />
                  <label className={`${line} flex items-center gap-3 cursor-pointer`}>
                    <span className="text-[#a89d8c] shrink-0">Deliver on</span>
                    <input type="date" min={today} value={when} onChange={e => setWhen(e.target.value)} aria-label="Send on" className={`w-full bg-transparent focus:outline-none text-[16px] ${when ? 'text-slate-900' : 'text-[#a89d8c]'}`} />
                  </label>
                </div>
                {writing
                  ? <textarea autoFocus value={note ?? tone.note} onChange={e => setNote(e.target.value.slice(0, 180))} rows={2} aria-label="Your note" className={`${line} h-auto py-3 resize-none leading-relaxed font-serif italic`} />
                  : <button onClick={() => setWriting(true)} className="text-sm text-[#5f574c] underline underline-offset-[6px] decoration-1 hover:text-slate-900" style={{ textDecorationColor: `${GOLD}88` }}>Write your own note</button>}
              </div>
              <a href={ready ? href : undefined} target={GIFT_CHECKOUT ? '_blank' : undefined} rel="noreferrer" aria-disabled={!ready}
                onClick={() => { if (!ready) return; rememberCta('pricing-gift'); setTimeout(() => setGiven(true), 400); }}
                className={`group mt-10 h-14 w-full rounded-full bg-slate-900 text-white text-[15px] font-semibold tracking-wide inline-flex items-center justify-center gap-3 transition-all ${ready ? 'hover:bg-black cursor-pointer' : 'opacity-30 cursor-not-allowed'}`}>
                Present the gift <span className="h-4 w-px bg-white/30" /> $88.88
              </a>
              <p className="mt-4 text-sm text-[#8a7f70] text-center">{ready ? (opens ? `Sealed, and delivered to them on ${opens}.` : 'Sealed, and delivered to them as soon as you give it.') : 'Their names and email. Nothing else to do.'}</p>
            </>
          )}
        </div>

        {/* The presentation box, lacquered in the occasion's colour, with the card resting inside */}
        <div className="relative mx-auto w-full max-w-[460px] order-first lg:order-none" aria-label="Preview of the gift">
          <div className="relative rounded-[2rem] p-6 md:p-9 transition-[background] duration-700"
            style={{ background: `radial-gradient(120% 80% at 30% 0%, ${tone.glow} 0%, ${tone.box} 55%, #0b0c10 130%)`, boxShadow: `0 60px 120px -50px ${tone.box}, inset 0 0 0 1px ${GOLD}40, inset 0 1px 0 rgba(255,255,255,0.08)` }}>
            <div aria-hidden="true" className="absolute inset-3 rounded-[1.5rem] pointer-events-none" style={{ boxShadow: `inset 0 0 0 1px ${GOLD}26` }} />
            <div className="flex items-center justify-between px-1 pb-5">
              <span className={caps} style={{ color: `${GOLD}` }}>Belluh</span>
              <span className={caps} style={{ color: `${GOLD}aa` }}>{tone.label}</span>
            </div>
            <div className={`relative rounded-[1.25rem] bg-[#fffdf8] px-7 py-9 md:px-9 md:py-11 flex flex-col min-h-[400px] transition-transform duration-700 ${given ? 'rotate-0 -translate-y-1' : '-rotate-[1.25deg] hover:rotate-0'}`}
              style={{ boxShadow: `0 30px 60px -30px rgba(0,0,0,0.6), inset 0 0 0 1px ${GOLD}55` }}>
              <div aria-hidden="true" className="absolute inset-[7px] rounded-[0.9rem] pointer-events-none" style={{ boxShadow: `inset 0 0 0 1px ${GOLD}30` }} />
              <div className="flex justify-center"><DragonflyMark size={30} rippleOnMount={false} /></div>
              <p className={`${caps} mt-8 text-center`} style={{ color: GOLD }}>Presented to</p>
              <p className={`mt-3 text-center font-serif text-[2.1rem] md:text-[2.6rem] leading-[1.08] tracking-tight break-words transition-colors ${names ? 'text-slate-900' : 'text-[#d6cdbd]'}`}>{names || 'Maya & Dan'}</p>
              <div className="mt-6 mx-auto h-px w-20" aria-hidden="true" style={{ background: GOLD }} />
              <p className="mt-6 text-center font-serif italic text-[17px] leading-relaxed text-[#4a443c] break-words">{shownNote}</p>
              <p className="mt-4 text-center font-serif text-[15px] text-[#6b6358]">— {from.trim() || 'you'}</p>
              <div className="mt-auto pt-8 text-center">
                <p className={caps} style={{ color: '#8a7f70' }}>{given ? 'Sealed' : opens ? `To be opened ${opens}` : 'One year of Belluh, for both'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PLANS = [
  { name: 'Free', price: '$0', per: 'for good', blurb: 'Start your shared memory today.', cta: 'Start free',
    items: ['Unlimited entries, private or shared', 'Your shared memory, kept for both of you', 'Belluh a few times a week', 'Weekly thing to try together'] },
  { name: 'Duo', price: '$7.77', per: 'a month for both of you, not each', alt: 'or $88.88 a year for both', blurb: 'Belluh, all in, for both of you.', cta: 'Start free', featured: true,
    items: ['Belluh whenever you want it', 'Text it on iMessage, WhatsApp or SMS', 'Dates planned, tables booked, flowers ready', 'Reminders, calendar, how-was-it follow ups'] },
  { name: 'For teams', price: 'Talk to us', per: 'employers, therapists, platforms', blurb: 'Belluh for the people you care for.', cta: 'Get in touch', team: true,
    items: ['A relationship benefit for your people', 'Between-sessions support for couples therapy', 'Belluh as a layer inside your platform', 'Private by design: you never see entries'] },
];

const STEPS = [
  { n: '1', title: 'Write a few lines', text: 'A minute a day each. Keep it private, or share it with your partner.' },
  { n: '2', title: 'Belluh connects the dots', text: 'Every Sunday, one small thing to try, drawn from what you both wrote.' },
  { n: '3', title: 'Plan it together', text: 'Ask in your shared thread. Belluh suggests times, and your partner picks one.' },
];

// A real app screen in a phone frame; sizes scale with the phone's width
// The three screens in Inside Belluh, left to right
const INSIDE_SCREENS = [
  { src: '/screens/write.webp', alt: 'Maya writing a few lines about her day', caption: 'Write a few lines' },
  { src: '/screens/us.webp', alt: 'Belluh planning a ramen night for Maya and Dan in their shared thread', caption: 'Plan it together' },
  { src: '/screens/home.webp', alt: 'Home, where Belluh offers to plan an anniversary, asks how a date went, and shows a reminder', caption: 'Belluh comes to you' },
];

const PhoneFrame: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className = '' }) => (
  <div className={`[container-type:inline-size] ${className}`}>
    <div className="rounded-[15cqw] bg-[#0f172a] p-[2.6cqw] shadow-[0_50px_100px_-30px_rgba(15,23,42,0.45),0_30px_80px_-30px_rgba(240,173,221,0.55)] ring-1 ring-black/5">
      <img src={src} alt={alt} width={390} height={898} decoding="async" className="block w-full h-auto rounded-[12.6cqw]" />
    </div>
  </div>
);

const FaqItem: React.FC<{ q: string; a: string; open: boolean; onToggle: () => void }> = ({ q, a, open, onToggle }) => (
  <div className={`rounded-[1.5rem] transition-colors duration-300 ${open ? 'bg-white shadow-[0_20px_50px_-28px_rgba(15,23,42,0.3)]' : 'hover:bg-white/60'}`}>
    <button onClick={onToggle} aria-expanded={open} className="w-full flex items-center justify-between gap-6 text-left px-5 md:px-7 py-5 md:py-6">
      <span className={`font-serif text-xl md:text-2xl tracking-tight transition-colors ${open ? 'text-slate-900' : 'text-slate-700'}`}>{q}</span>
      <Plus size={20} className={`shrink-0 text-[#9bbecb] transition-transform duration-300 ${open ? 'rotate-45 text-[#e58fc9]' : ''}`} />
    </button>
    <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
      <div className="overflow-hidden">
        <p className="px-5 md:px-7 pb-6 -mt-1 text-[16px] md:text-[17px] text-slate-500 leading-relaxed max-w-2xl">{a}</p>
      </div>
    </div>
  </div>
);

// Example entries for the stories strip, each with what Belluh does with it
const MOMENTS = [
  { when: 'Tuesday, 8:12 pm', text: "The way you look at me when I'm cooking... it felt like home.", belluh: 'saved it to what matters to you' },
  { when: 'Saturday, 4:47 pm', text: 'I never want to forget the sound of your laugh in the rain.', belluh: 'kept it for your anniversary' },
  { when: 'Sunday, 11:03 am', text: 'Found that old ticket stub from our first date.', belluh: 'added it to your first date' },
  { when: 'Saturday, 9:20 am', text: 'Just a quiet morning with coffee and you. Perfect.', belluh: 'kept it for your week in review' },
  { when: 'Friday, 1:14 am', text: 'We stayed up way too late talking about the future.', belluh: 'remembered the plans you made' },
];
const MOMENT_TONES = ['bg-white', 'bg-[#fdf0f8]', 'bg-[#eef7fa]'];

// What Belluh connects to, shown in the second scrolling strip
const INTEGRATIONS = [
  { name: 'WhatsApp', domain: 'whatsapp.com', logo: '/logos/whatsapp.png' },
  { name: 'Google Calendar', domain: 'calendar.google.com', logo: '/logos/google-calendar.png' },
  { name: 'Apple iCloud', domain: 'icloud.com', logo: '/logos/icloud.png' },
  { name: 'Outlook', domain: 'outlook.live.com', logo: '/logos/outlook.png' },
  { name: 'Gemini', domain: 'gemini.google.com', logo: '/logos/gemini.png' },
];

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onShowLegal: (type: 'tos' | 'privacy') => void;
  onGoToAbout: () => void;
  onGoToCareers: () => void;
}

// Universities get one row and companies the other
const isUniversity = (domain: string) => /\.(edu|ac\.uk|ca)$/.test(domain);

type Org = { name: string; domain: string; logo?: string };

// Real logos only (grey until you hover), served from belluh.com so they always load. Never text.
const LogoItem = ({ org }: { org: Org }) => {
  const [failed, setFailed] = useState(false);
  if (!org.logo) return null;
  return (
    <img src={org.logo} alt={org.name} title={org.name} decoding="async" draggable={false} onError={() => setFailed(true)}
      className={`max-h-10 md:max-h-12 max-w-full w-auto h-auto object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-[filter,opacity] duration-500 select-none ${failed ? 'invisible' : ''}`} />
  );
};

const FADE_X = { WebkitMaskImage: 'linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)', maskImage: 'linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)' } as React.CSSProperties;

const MarqueeRow = ({ orgs, reverse = false, speed = 60 }: { orgs: Org[]; reverse?: boolean; speed?: number }) => {
  // Two identical halves, so sliding by half loops without a seam; short lists are repeated to fill wide screens
  const shown = orgs.filter(o => o.logo);
  const half = Array.from({ length: Math.max(1, Math.ceil(12 / Math.max(1, shown.length))) }, () => shown).flat();
  return (
    <div className="relative flex overflow-hidden group" style={FADE_X}>
      <div className={`flex items-center w-max ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'} group-hover:[animation-play-state:paused]`} style={{ animationDuration: `${speed}s`, willChange: 'transform', backfaceVisibility: 'hidden' }}>
        {[...half, ...half].map((org, i) => (
          <div key={i} aria-hidden={i >= half.length ? true : undefined} className="shrink-0 flex items-center justify-center h-16 w-[132px] md:w-[184px] px-4">
            <LogoItem org={org} />
          </div>
        ))}
      </div>
    </div>
  );
};

const LogoMarquee = ({ title, orgs, note }: { title: string; orgs: Org[]; note: string; repeat?: number }) => {
  const schools = orgs.filter(o => isUniversity(o.domain));
  const others = orgs.filter(o => !isUniversity(o.domain));
  return (
    <section className="w-full py-20 md:py-24 relative z-20" aria-label={title}>
      <p className="text-center mb-10 md:mb-12 px-4 text-[11px] md:text-xs font-bold text-slate-400 tracking-[0.25em] uppercase">{title}</p>
      <div className="space-y-6 md:space-y-8">
        {schools.length > 0 && <MarqueeRow orgs={schools} reverse speed={70} />}
        {others.length > 0 && <MarqueeRow orgs={others} speed={schools.length ? 80 : 45} />}
      </div>
      <p className="text-center mt-10 px-4 text-[10px] text-slate-300 font-medium tracking-wide uppercase">{note}</p>
    </section>
  );
};


// Tap Belluh and it becomes something else, then back to water
const FUN_SHAPES: { emoji: string; label: string }[] = [
  { emoji: '🦒', label: 'giraffe' }, { emoji: '🐈', label: 'cat' }, { emoji: '🐬', label: 'dolphin' }, { emoji: '🦋', label: 'butterfly' },
  { emoji: '🦖', label: 'dinosaur' }, { emoji: '🌻', label: 'sunflower' }, { emoji: '🚀', label: 'rocket' }, { emoji: '❤️', label: 'heart' },
];
function useShapeTap() {
  const [n, setN] = useState(-1);
  const cur = useRef(-1);
  const tap = () => {
    const next = cur.current + 1 >= FUN_SHAPES.length ? -1 : cur.current + 1;
    if (next < 0) belluh.become('water', 'water', false);
    else belluh.become({ emoji: FUN_SHAPES[next].emoji }, FUN_SHAPES[next].label, false);
    cur.current = next; setN(next);
  };
  return { tap, label: n < 0 ? null : FUN_SHAPES[n].label };
}

const TRY_EXAMPLES = ['turn into a cat', 'become a sunflower', 'turn into the letter J', 'become a rocket', 'turn into a dolphin', 'become a heart'];
const withArticle = (thing: string) => (/^(the|a|an)\s/i.test(thing) ? thing : `${/^[aeiou]/i.test(thing) ? 'an' : 'a'} ${thing}`);

// Belluh, live: it listens as you type, thinks, talks word by word, and becomes what you ask for
const MeetBelluh: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  const [state, setState] = useState<BelluhState>(belluh.state());
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState({ id: 0, text: "Hi, I'm Belluh. Ask me to become anything." });
  const [hint, setHint] = useState(0);
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  useEffect(() => belluh.subscribe(setState), []);
  useEffect(() => { belluh.prefetch(); const onR = () => setWide(window.innerWidth >= 768); window.addEventListener('resize', onR); return () => window.removeEventListener('resize', onR); }, []);
  useEffect(() => { const t = setInterval(() => setHint(h => (h + 1) % TRY_EXAMPLES.length), 2600); return () => clearInterval(t); }, []);
  const say = (t: string) => setReply(r => ({ id: r.id + 1, text: t }));

  const submit = async (e?: React.FormEvent, asked?: string) => {
    e?.preventDefault();
    const t = (asked ?? text).trim();
    if (!t || busy) return;
    setText(''); setBusy(true);
    const release = belluh.holdThinking();
    const res = await belluh.tryShape(t).catch(() => ({ asked: false, done: false, subject: '' }));
    await new Promise(r => setTimeout(r, 650));
    release(); setBusy(false);
    if (res.asked && res.subject === 'water') say("Back to water. This is where I'm most myself.");
    else if (res.done) say(`Here I am as ${withArticle(res.subject)}. Still water, just a different shape.`);
    else if (res.asked) say(`Sign up and I'll draw ${withArticle(res.subject)} for you. Here I only know everyday things.`);
    else say('In the app I plan your dates, remember the little things and write with you both. Here, ask me to become something.');
  };

  const STATES: { key: BelluhState; label: string; text: string }[] = [
    { key: 'listening', label: 'Listening', text: 'Every key you type ripples the water.' },
    { key: 'thinking', label: 'Thinking', text: 'The ripples circle and it glows from inside.' },
    { key: 'talking', label: 'Talking', text: 'Every word it says moves the water.' },
  ];

  return (
    <section id="meet" className="relative z-10 px-6 pt-20 pb-8 scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-[2.5rem] md:rounded-[3rem] overflow-hidden bg-gradient-to-br from-[#F8FBFC] via-[#F4FAFC] to-[#fdf5fa]">
          <div className="absolute -top-40 -left-24 w-[520px] h-[520px] rounded-full bg-[#CDE9F2]/70 blur-[110px] pointer-events-none"></div>
          <div className="absolute -bottom-48 right-[-10%] w-[560px] h-[560px] rounded-full bg-[#f0addd]/25 blur-[120px] pointer-events-none"></div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 items-center gap-6 md:gap-10 p-8 md:p-16">
            <div className="flex flex-col items-center order-1">
              <div className="relative">
                <div className="absolute inset-[-18%] rounded-full bg-[radial-gradient(circle,rgba(205,233,242,0.9)_0%,rgba(205,233,242,0)_65%)] blur-2xl animate-breathing pointer-events-none"></div>
                <BelluhOrb size={wide ? 300 : 210} onTap={() => {}} label="Belluh. Tap to make a ripple." />
              </div>
              <p className="mt-6 min-h-[3.5rem] max-w-sm text-center font-serif text-xl md:text-2xl leading-snug text-slate-800" aria-live="polite">
                <BelluhSpeech key={reply.id} text={reply.text} />
              </p>
            </div>
            <div className="order-2 text-center md:text-left">
              <h2 className="text-4xl md:text-6xl font-serif leading-[1.05] tracking-tight mb-5 drop-shadow-sm">
                <span className="text-[#9bbecb]">Meet</span> <span className="text-[#f0addd] italic">Belluh.</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-500 font-light leading-relaxed mb-8 max-w-md mx-auto md:mx-0">
                You're both busy. Someone should be paying attention. Belluh listens to you both, remembers what matters and nudges you back toward each other. Type below and watch it think.
              </p>
              <div className="mb-8">
                <div className="inline-flex p-1 rounded-full bg-white/70 border border-white shadow-[0_8px_24px_-16px_rgba(15,23,42,0.3)]" aria-label="What Belluh is doing">
                  {STATES.map(st => (
                    <span key={st.key} className={`h-9 px-4 inline-flex items-center gap-2 rounded-full text-[13px] font-semibold transition-all duration-500 ${state === st.key ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>
                      {st.label}
                    </span>
                  ))}
                </div>
                <p className="mt-3 min-h-[1.5rem] text-slate-500">{(STATES.find(st => st.key === state) ?? { text: 'Type below and watch the water listen.' }).text}</p>
              </div>
              <form onSubmit={submit} className="flex items-center gap-2 bg-white rounded-full border border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.18)] p-1.5 pl-5 focus-within:border-[#CDE9F2] focus-within:shadow-[0_20px_50px_-15px_rgba(155,190,203,0.6)] transition-all">
                <input
                  value={text}
                  onChange={e => { setText(e.target.value); belluh.key(); }}
                  placeholder={`Try: ${TRY_EXAMPLES[hint]}`}
                  aria-label="Say something to Belluh"
                  maxLength={80}
                  className="flex-1 min-w-0 bg-transparent py-2.5 text-[16px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                <button type="submit" disabled={busy || !text.trim()} className="shrink-0 h-11 px-5 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-black disabled:bg-[#EAF4F8] disabled:text-[#7fa6b4] disabled:hover:bg-[#EAF4F8] transition-all active:scale-95">Ask</button>
              </form>
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                {['a cat', 'a sunflower', 'the letter J', 'a rocket', 'a heart'].map(t => (
                  <button key={t} type="button" disabled={busy} onClick={() => submit(undefined, `turn into ${t}`)} className="h-9 px-3.5 rounded-full bg-white/80 border border-slate-200/70 text-[13px] font-semibold text-slate-600 hover:border-[#9bbecb] hover:text-[#3f7486] disabled:opacity-50 transition-colors">{t}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onShowLegal, onGoToAbout, onGoToCareers }) => {
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const heroTap = useShapeTap();
  const ctaTap = useShapeTap();
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  useEffect(() => { const onR = () => setIsDesktop(window.innerWidth >= 768); window.addEventListener('resize', onR); return () => window.removeEventListener('resize', onR); }, []);
  const heroSize = () => (typeof window === 'undefined' ? 200 : window.innerWidth >= 1024 ? Math.min(260, Math.round(window.innerHeight * 0.3)) : window.innerWidth >= 640 ? 230 : 112);
  const [heroOrb, setHeroOrb] = useState(heroSize);
  useEffect(() => {
    const onR = () => setHeroOrb(heroSize());
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setPastHero(currentScrollY > window.innerHeight * 0.6);
      
      setIsNavVisible(true);
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
      if (isMenuOpen) {
          document.body.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = 'unset';
      }
      return () => {
          document.body.style.overflow = 'unset';
      };
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const scrollToSection = (id: string) => {
      setIsMenuOpen(false);
      const element = document.getElementById(id);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
      }
  };

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const menuItems = [
      { label: 'Meet Belluh', action: () => scrollToSection('meet') },
      { label: 'What it does', action: () => scrollToSection('features') },
      { label: 'Inside', action: () => scrollToSection('inside') },
      { label: 'Stories', action: () => scrollToSection('stories') },
      { label: 'Pricing', action: () => scrollToSection('pricing') },
      { label: 'FAQ', action: () => scrollToSection('faq') },
      { label: 'Privacy', action: () => { toggleMenu(); onShowLegal('privacy'); } },
      { label: 'Our Why', action: () => { toggleMenu(); onGoToAbout(); } },
      { label: 'Careers', action: () => { toggleMenu(); onGoToCareers(); } }
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 font-sans selection:bg-[#f0addd] selection:text-white overflow-x-hidden relative">
      
      {/* --- Ambient Cloud Background Layers --- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#CDE9F2]/30 rounded-full blur-[120px] animate-float opacity-60"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#f0addd]/20 rounded-full blur-[130px] animate-pulse-slow opacity-50"></div>
          <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-white rounded-full blur-[80px] animate-breathing opacity-80 mix-blend-overlay"></div>
      </div>

      {/* Top bar */}
      <SiteNav
          links={[
              { label: 'Meet Belluh', onClick: () => scrollToSection('meet'), section: 'meet' },
              { label: 'What it does', onClick: () => scrollToSection('features'), section: 'features' },
              { label: 'Inside', onClick: () => scrollToSection('inside'), section: 'inside' },
              { label: 'Stories', onClick: () => scrollToSection('stories'), section: 'stories' },
              { label: 'Pricing', onClick: () => scrollToSection('pricing'), section: 'pricing' },
              { label: 'FAQ', onClick: () => scrollToSection('faq'), section: 'faq' },
          ]}
          onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onLogin={onLogin}
          onGetStarted={() => { rememberCta('nav'); onGetStarted(); }}
          onMenu={toggleMenu}
      />

      {/* Full Screen Menu Overlay - Clean Design */}
      <div className={`fixed inset-0 z-[100] bg-white overflow-y-auto overscroll-contain transition-all duration-700 ease-[cubic-bezier(0.32,0.725,0,1)] ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
          <div className="flex flex-col min-h-full p-6 md:p-10 relative max-w-7xl mx-auto w-full">
               <div className="flex justify-between items-center mb-6 md:mb-8">
                   <span className="font-serif text-2xl font-bold tracking-tight text-[#9bbecb]">Belluh</span>
                   <button 
                    onClick={toggleMenu}
                    className="bg-slate-50 text-slate-900 w-12 h-12 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-100"
                   >
                       <X size={24} strokeWidth={2} />
                   </button>
               </div>

               <div className="flex-1 flex flex-col justify-center items-start gap-3 md:gap-5 py-2 animate-slide-up pl-2">
                   {menuItems.map((item, idx) => (
                       <button 
                         key={idx}
                         onClick={item.action}
                         className="group relative flex items-start gap-6 text-left transition-all duration-500 w-full md:w-auto"
                       >
                           <span className="text-xs font-bold font-sans text-slate-200 group-hover:text-[#9bbecb] mt-1 md:mt-2 transition-colors duration-300">{idx + 1}</span>
                           <span style={{ fontSize: 'clamp(2rem, min(9vw, 6vh), 6rem)' }} className="font-serif font-medium text-slate-300 group-hover:text-[#9bbecb] tracking-tighter transition-colors duration-300 leading-[0.9] group-hover:translate-x-2 transform">
                               {item.label}
                           </span>
                       </button>
                   ))}
               </div>

               <div className="flex flex-col md:flex-row gap-3 md:gap-4 mt-auto pt-6 w-full max-w-md md:max-w-xl animate-fade-in">
                   <button 
                       onClick={() => { toggleMenu(); onLogin(); }}
                       className="w-full py-3.5 md:py-4 rounded-full bg-slate-50 font-bold text-slate-900 hover:bg-slate-100 transition-colors text-lg border border-slate-100"
                   >
                       Sign In
                   </button>
                   <button 
                       onClick={() => { toggleMenu(); rememberCta('menu'); onGetStarted(); }}
                       className="w-full py-3.5 md:py-4 rounded-full bg-[#9bbecb] text-white font-bold hover:bg-[#8aaab7] transition-colors shadow-xl text-lg flex items-center justify-center gap-2"
                   >
                       Start free <ArrowRight size={18} />
                   </button>
               </div>
          </div>
      </div>

      {/* Hero: what it is on the left, Belluh doing it on the right */}
      <section className="relative z-10 min-h-[100svh] flex items-center pt-[68px] pb-5 md:pt-24 md:pb-12 px-6">
         <div className="w-full max-w-7xl mx-auto md:px-6 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] items-center gap-6 sm:gap-12 lg:gap-6">
             <div className="text-center lg:text-left" style={{ animation: 'slideUp 0.9s cubic-bezier(0.16,1,0.3,1) both' }}>
                 <h1 className="font-serif tracking-tight leading-[0.98] text-[2.85rem] sm:text-7xl xl:text-[5.6rem]">
                     <span className="text-[#9bbecb]">Life gets busy.</span><br />
                     <span className="text-[#f0addd] italic">Love drifts.</span>
                 </h1>
                 <p className="mt-5 sm:mt-7 text-[17px] md:text-[1.35rem] text-slate-500 font-light leading-relaxed max-w-xl mx-auto lg:mx-0 min-h-[5.4rem] md:min-h-[4.4rem] [text-wrap:pretty]">
                     <BelluhSpeech text="The plans you never made. The moments you forgot. Belluh, the AI journal for couples, keeps them for you both." delay={500} />
                 </p>
                 <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-1.5 sm:gap-3">
                     <button onClick={() => { rememberCta('hero'); onGetStarted(); }} className="group w-full sm:w-auto h-14 px-8 rounded-full bg-slate-900 text-white text-[15px] font-bold inline-flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-[0_18px_40px_-18px_rgba(15,23,42,0.6)]">
                         Start free <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                     </button>
                     <button onClick={onLogin} className="w-full sm:w-auto h-11 sm:h-14 px-7 rounded-full text-[15px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-colors">
                         I have an account
                     </button>
                 </div>
                 <div className="mt-5 sm:mt-9 flex flex-wrap justify-center lg:justify-start gap-x-5 sm:gap-x-7 gap-y-2 text-[13px] sm:text-sm text-slate-500">
                     <span className="inline-flex items-center gap-2"><Heart size={15} className="text-[#f0addd]" /> Free to start</span>
                     <span className="inline-flex items-center gap-2"><Lock size={15} className="text-[#9bbecb]" /> Private by default</span>
                     <span className="inline-flex items-center gap-2"><MessageCircle size={15} className="text-[#9bbecb]" /> Works over text</span>
                 </div>
             </div>

             {/* Belluh, live, with what it's doing for a couple floating around it */}
             <div className="relative order-first lg:order-none mx-auto w-full max-w-[min(560px,72svh)]" style={{ animation: 'slideUp 1s 0.15s cubic-bezier(0.16,1,0.3,1) both' }}>
                 <div className="relative h-[150px] sm:h-auto sm:aspect-square">
                     <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(205,233,242,0.95)_0%,rgba(240,173,221,0.18)_45%,rgba(255,255,255,0)_70%)] blur-2xl animate-breathing pointer-events-none" />
                     <div className="absolute inset-0 flex flex-col items-center justify-center sm:pb-[6%]">
                         <BelluhOrb size={heroOrb} onTap={heroTap.tap} label="Belluh. Tap to change its shape." />
                         <p className="mt-2 sm:mt-3 h-5 text-xs font-semibold tracking-wide text-slate-400" aria-live="polite">{heroTap.label ? `A ${heroTap.label}. Tap again.` : 'Tap Belluh'}</p>
                     </div>

                     <div className="hidden sm:block absolute left-0 top-[6%] w-[60%] max-w-[300px]" style={{ animation: 'slideUp 0.8s 0.9s cubic-bezier(0.16,1,0.3,1) both' }}>
                         <div className="animate-float rounded-3xl bg-white/90 backdrop-blur-xl border border-white shadow-[0_24px_60px_-24px_rgba(15,23,42,0.35)] p-4">
                             <div className="flex items-center gap-2"><BelluhOrb size={22} /><span className="text-[13px] font-bold text-slate-900">Belluh</span><span className="ml-auto text-[11px] text-slate-400">now</span></div>
                             <p className="mt-2 font-serif text-[14px] sm:text-[15px] leading-snug text-slate-800">Dan's birthday is in 12 days. He wrote that he misses shooting film. Want me to plan it?</p>
                             <div className="mt-3 flex items-center gap-2"><span className="h-8 px-3.5 inline-flex items-center rounded-full bg-slate-900 text-white text-xs font-bold">Plan it</span><span className="h-8 px-3 inline-flex items-center text-xs font-semibold text-slate-400">Not now</span></div>
                         </div>
                     </div>

                     <div className="hidden sm:block absolute right-0 -bottom-[2%] w-[56%] max-w-[290px]" style={{ animation: 'slideUp 0.8s 1.5s cubic-bezier(0.16,1,0.3,1) both' }}>
                         <div className="animate-float rounded-3xl bg-white/90 backdrop-blur-xl border border-white shadow-[0_24px_60px_-24px_rgba(15,23,42,0.35)] p-4" style={{ animationDelay: '-3s' }}>
                             <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#e58fc9]">Plan for you &amp; Dan</p>
                             <p className="mt-1.5 font-serif text-[15px] sm:text-base text-slate-900">Ramen, then the night market</p>
                             <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#3f7486]"><CalendarCheck size={14} /> Friday 7:00 PM, in both calendars</p>
                         </div>
                     </div>

                     <div className="hidden sm:block absolute right-[2%] top-[14%]" style={{ animation: 'slideUp 0.8s 2.1s cubic-bezier(0.16,1,0.3,1) both' }}>
                         <div className="animate-float inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white/90 backdrop-blur-xl border border-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.35)] text-[13px] font-semibold text-slate-700" style={{ animationDelay: '-1.5s' }}>
                             <Lock size={14} className="text-[#e58fc9]" /> Just me, never shared
                         </div>
                     </div>
                 </div>
             </div>
         </div>
      </section>

      {/* Where Belluh's couples are */}
      <LogoMarquee title="Used by couples at" orgs={ORGANIZATIONS} note="* Used independently by individuals. Not affiliated with these organizations." />

      <MeetBelluh onGetStarted={onGetStarted} />

      <LandingDemos onShowPrivacy={() => onShowLegal('privacy')} />

      {/* Real app screens */}
      <section id="inside" className="relative z-10 px-6 pb-28 scroll-mt-24">
          <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-serif text-center leading-tight mb-4 drop-shadow-sm">
                  <span className="text-[#9bbecb]">Inside</span> <span className="text-[#f0addd] italic">Belluh.</span>
              </h2>
              <p className="text-center text-lg text-slate-500 font-light mb-12">What remembering for two looks like. Real screens, with a sample couple.</p>

              <div className="group relative md:h-[760px] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden border border-white bg-gradient-to-b from-white/70 to-[#fdf2f9]/60 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)]">
                  <div className="absolute -top-40 -left-32 w-[560px] h-[560px] rounded-full bg-[#CDE9F2]/70 blur-[110px] pointer-events-none"></div>
                  <div className="absolute -bottom-48 -right-32 w-[620px] h-[620px] rounded-full bg-[#f0addd]/35 blur-[120px] pointer-events-none"></div>

                  {/* Three real screens side by side, each fully in view; on phones they swipe */}
                  <div className="relative flex md:justify-center items-start gap-5 md:gap-12 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar px-[calc(50%-125px)] md:px-10 pt-10 md:pt-16 pb-8 md:pb-0">
                      {INSIDE_SCREENS.map((sc, i) => (
                          <figure key={sc.src} className={`snap-center shrink-0 w-[250px] ${i === 1 ? 'md:w-[316px] relative z-10' : 'md:w-[280px] md:mt-20'} transition-transform duration-700 ${i === 0 ? 'md:-rotate-[4deg] md:group-hover:-rotate-[5deg] md:group-hover:-translate-x-1' : i === 2 ? 'md:rotate-[4deg] md:group-hover:rotate-[5deg] md:group-hover:translate-x-1' : 'md:group-hover:-translate-y-2'}`}>
                              <PhoneFrame src={sc.src} alt={sc.alt} />
                              <figcaption className="md:hidden mt-4 text-center text-sm font-semibold text-slate-600">{sc.caption}</figcaption>
                          </figure>
                      ))}
                  </div>
              </div>

              <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-3">
                  <div className="w-full max-w-[340px] rounded-3xl bg-white border border-slate-100 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.25)] p-3.5 flex gap-3">
                      <div className="shrink-0 pt-0.5"><BelluhOrb size={32} /></div>
                      <div className="min-w-0">
                          <div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-slate-900">Belluh</span><span className="text-xs text-slate-400">now</span></div>
                          <p className="text-[13px] md:text-sm text-slate-600 leading-snug mt-0.5">Dan picked Friday at 7:00 PM for "Ramen, then the night market".</p>
                      </div>
                  </div>
                  <div className="inline-flex items-center gap-2.5 rounded-full bg-white border border-slate-100 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.25)] px-5 py-3.5">
                      <Lock size={16} className="text-[#3f7486]" />
                      <span className="text-sm font-bold text-slate-700">Private entries stay private</span>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mt-14 px-2">
                  {STEPS.map(s => (
                      <div key={s.n}>
                          <p className="text-xs font-bold tracking-widest text-[#f0addd]">{s.n}</p>
                          <p className="mt-2 font-serif text-2xl text-slate-900">{s.title}</p>
                          <p className="mt-2 text-slate-500 font-light leading-relaxed">{s.text}</p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* Marquee Section */}
      <LogoMarquee title="Works with" orgs={INTEGRATIONS} note="* Trademarks belong to their owners." repeat={6} />

      {/* Infinite Marquee Section */}
      <section id="stories" className="relative z-10 py-24 md:py-32 overflow-hidden scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6 mb-14 md:mb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9bbecb] mb-5">The kind of thing you'll write</p>
                <h2 className="font-serif text-5xl md:text-7xl tracking-tight text-slate-900 leading-[1.02]">The ordinary <span className="italic text-[#f0addd]">Tuesdays</span><br className="hidden md:block" /> <span className="whitespace-nowrap">slip away.</span></h2>
            </div>
            <p className="text-slate-500 text-lg md:text-xl font-light leading-relaxed max-w-sm md:text-right">
                You'll remember the wedding. Belluh keeps the rest: the coffee, the late talks, the ticket stub in the drawer.
            </p>
        </div>

        <div>
            {[MOMENTS].map((row, r) => (
                <div key={r} className="relative flex overflow-hidden group py-12 -my-9" style={FADE_X}>
                    <div className={`flex w-max ${r ? 'animate-marquee-reverse' : 'animate-marquee'} group-hover:[animation-play-state:paused]`} style={{ animationDuration: r ? '75s' : '65s', willChange: 'transform', backfaceVisibility: 'hidden' }}>
                        {[...row, ...row].map((m, i) => (
                            <article key={i} aria-hidden={i >= row.length ? true : undefined} className={`shrink-0 mx-3 md:mx-4 w-[300px] md:w-[380px] min-h-[300px] rounded-[1.75rem] p-7 md:p-8 flex flex-col shadow-[0_18px_40px_-24px_rgba(15,23,42,0.25)] transition-transform duration-500 hover:-translate-y-1.5 hover:rotate-0 ${MOMENT_TONES[i % 3]} ${i % 2 ? 'rotate-[0.8deg]' : '-rotate-[0.8deg]'}`}>
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{m.when}</p>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">{i % 5 === 3 ? <><Lock size={11} /> Just me</> : 'Shared'}</span>
                                </div>
                                <p className="mt-5 flex-1 font-serif text-xl md:text-[1.45rem] leading-snug text-slate-800 whitespace-normal">{m.text}</p>
                                <div className="mt-7 flex items-start gap-2.5 rounded-2xl bg-white/70 px-3.5 py-3 whitespace-normal">
                                    <BelluhOrb size={18} className="mt-0.5" />
                                    <p className="text-[13px] leading-snug text-slate-600"><span className="font-serif font-bold text-[#7fa7b6]">Belluh</span> {m.belluh}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </section>
      
      {/* Why Belluh exists, in Jimmy's words, next to the evening it started with */}
      <section id="why" className="relative z-10 px-6 py-24 md:py-36 scroll-mt-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] items-center gap-16 lg:gap-20">
              <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9bbecb] mb-8">Why Belluh exists</p>
                  <span className="block font-serif text-8xl leading-[0.5] text-[#f0addd] select-none" aria-hidden="true">&ldquo;</span>
                  <blockquote className="mt-2 font-serif text-[2.1rem] md:text-[3.4rem] leading-[1.1] tracking-tight text-slate-900">
                      We've built a world of perfect documentation and <span className="text-[#f0addd] italic">zero remembrance.</span>
                  </blockquote>
                  <p className="mt-8 text-lg md:text-xl text-slate-500 font-light leading-relaxed max-w-xl">
                      Love isn't always built in the big moments. It's built in the supermarket. It's built in how someone listens when you talk about shrimp.
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                      <p className="font-serif text-2xl italic text-[#9bbecb]">— Jimmy</p>
                      <button onClick={onGoToAbout} className="group inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors">
                          Read the whole story <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                      </button>
                  </div>
              </div>
              <button onClick={onGoToAbout} aria-label="Read the story behind Belluh" className="block w-full max-w-[340px] mx-auto lg:mr-0">
                  <Receipt />
              </button>
          </div>
      </section>

      {/* Pricing: the shared memory is the product; you pay for Belluh doing more with it */}
      <section id="pricing" className="relative z-10 px-6 py-24 md:py-32 scroll-mt-24">
          <div className="max-w-6xl mx-auto">
              <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9bbecb] mb-5">Pricing</p>
                  <h2 className="font-serif text-5xl md:text-6xl tracking-tight leading-[1.02]">
                      <span className="text-slate-900">One memory.</span><br /><span className="text-[#f0addd] italic">Two of you.</span>
                  </h2>
                  <p className="mt-6 text-lg text-slate-500 font-light leading-relaxed">Everything you write becomes a memory you both own, and it only grows. One price covers the couple, never each of you.</p>
              </div>
              <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
                  {PLANS.map(plan => (
                      <div key={plan.name} className={`relative rounded-[2rem] p-8 flex flex-col ${plan.featured ? 'bg-white border-2 border-slate-900 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)]' : 'bg-white/70 border border-slate-100'}`}>
                          {plan.featured && <span className="absolute -top-3 left-8 h-6 px-3 rounded-full bg-slate-900 text-white text-[11px] font-bold tracking-wide inline-flex items-center">Most couples</span>}
                          <p className="font-serif text-2xl text-slate-900">{plan.name}</p>
                          <p className="mt-1 text-sm text-slate-500">{plan.blurb}</p>
                          <p className="mt-7 flex items-baseline gap-2 flex-wrap"><span className={`font-serif ${plan.team ? 'text-3xl' : 'text-5xl'} text-slate-900 tracking-tight`}>{plan.price}</span><span className="text-sm text-slate-400">{plan.per}</span></p>
                          {plan.alt ? <p className="mt-1 text-sm text-[#3f7486] font-semibold">{plan.alt}</p> : <p className="mt-1 text-sm">&nbsp;</p>}
                          <ul className="mt-7 space-y-3 flex-1">
                              {plan.items.map(it => <li key={it} className="flex items-start gap-3 text-[15px] text-slate-600"><Check size={17} className="mt-0.5 shrink-0 text-[#9bbecb]" />{it}</li>)}
                          </ul>
                          {plan.team ? (
                              <a href="mailto:hello@belluh.com?subject=Belluh%20for%20teams" className="mt-8 h-12 rounded-full border border-slate-200 text-slate-800 text-sm font-bold inline-flex items-center justify-center gap-2 hover:border-slate-400 transition-colors">{plan.cta} <ArrowRight size={15} /></a>
                          ) : (
                              <button onClick={() => { rememberCta(`pricing-${plan.name.toLowerCase()}`); onGetStarted(); }} className={`mt-8 h-12 rounded-full text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors ${plan.featured ? 'bg-slate-900 text-white hover:bg-black' : 'bg-white border border-slate-200 text-slate-800 hover:border-slate-400'}`}>{plan.cta} <ArrowRight size={15} /></button>
                          )}
                      </div>
                  ))}
              </div>
              <GiftCard />
              <p className="mt-8 text-sm text-slate-400">No card to start. Your entries are never sold.</p>
          </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 px-6 py-24 md:py-32 scroll-mt-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16 items-start">
              <div className="lg:sticky lg:top-28">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9bbecb] mb-5">FAQ</p>
                  <h2 className="font-serif text-5xl md:text-6xl tracking-tight leading-[1.02]">
                      <span className="text-slate-900">Questions,</span><br /><span className="text-[#f0addd] italic">answered.</span>
                  </h2>
                  <p className="mt-6 text-lg text-slate-500 font-light leading-relaxed max-w-sm">Anything else, ask Belluh. It knows how it works, and it's free to try.</p>
                  <button onClick={() => { rememberCta('faq'); onGetStarted(); }} className="mt-7 group inline-flex items-center gap-2 h-11 px-5 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-black transition-colors">Start free <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></button>
              </div>
              <div className="space-y-1.5 -mx-5 md:mx-0">
                  {FAQ.map((f, i) => <FaqItem key={f.q} q={f.q} a={f.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />)}
              </div>
          </div>
      </section>

      {/* The last word before the footer */}
      <section className="relative z-10 px-6 pb-24 md:pb-32">
          <div className="relative max-w-6xl mx-auto overflow-hidden rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-br from-[#eef7fa] via-white to-[#fdf0f8] border border-white shadow-[0_40px_100px_-50px_rgba(63,116,134,0.5)]">
              <div className="absolute -top-32 -right-24 w-[460px] h-[460px] rounded-full bg-[#CDE9F2]/60 blur-[100px] pointer-events-none" />
              <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-10 px-8 py-14 md:px-16 md:py-20">
                  <div className="text-center md:text-left">
                      <h2 className="font-serif text-5xl md:text-7xl tracking-tight leading-[1.0]">
                          <span className="text-[#9bbecb]">Keep tonight.</span><br /><span className="text-[#f0addd] italic">Together.</span>
                      </h2>
                      <p className="mt-6 text-lg md:text-xl text-slate-500 font-light leading-relaxed max-w-lg mx-auto md:mx-0">By Sunday it will have blurred into the rest of the week. Write one line now, send your partner the link, and your first insight arrives on Sunday.</p>
                      <div className="mt-9 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
                          <button onClick={() => { rememberCta('final'); onGetStarted(); }} className="group w-full sm:w-auto h-14 px-8 rounded-full bg-slate-900 text-white text-[15px] font-bold inline-flex items-center justify-center gap-2 hover:bg-black transition-colors">Start free <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" /></button>
                          <button onClick={onLogin} className="w-full sm:w-auto h-14 px-7 rounded-full text-[15px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-white transition-colors">I have an account</button>
                      </div>
                  </div>
                  <div className="flex flex-col items-center">
                      <BelluhOrb size={isDesktop ? 220 : 150} onTap={ctaTap.tap} label="Belluh. Tap to change its shape." />
                      <p className="mt-3 h-5 text-xs font-semibold text-slate-400" aria-live="polite">{ctaTap.label ? `A ${ctaTap.label}. Tap again.` : 'Tap Belluh'}</p>
                  </div>
              </div>
          </div>
      </section>

      <SiteFooter
          onTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onSection={scrollToSection}
          onGetStarted={() => { rememberCta('footer'); onGetStarted(); }}
          onLogin={onLogin}
          onShowLegal={onShowLegal}
          onGoToAbout={onGoToAbout}
          onGoToCareers={onGoToCareers}
      />
      
      <style>{`
        .mask-gradient-x {
            mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
      `}</style>
    </div>
  );
};

export default LandingPage;