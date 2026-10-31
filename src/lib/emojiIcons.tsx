// Belluh draws no line icons: like Airbnb's and Pampam's, the pictures are 3D emoji (see emoji3d.tsx). This module stands in for lucide-react (Vite
// aliases the package here), so every icon in the app becomes an emoji with the same name and props. Controls that
// are really punctuation (close, arrows, chevrons, plus, check) are plain text glyphs, so they take the text color.
import React from 'react';
import { emojiSrc } from './emoji3d';

type Props = { size?: number | string; className?: string; strokeWidth?: number | string; fill?: string; fillOpacity?: number; color?: string; style?: React.CSSProperties; 'aria-label'?: string; 'aria-hidden'?: boolean | 'true' | 'false'; onClick?: React.MouseEventHandler };

const T = '︎'; // text presentation: an arrow stays an arrow, not an emoji tile

const make = (emoji: string, glyph = false) => {
  const src = glyph ? null : emojiSrc(emoji);
  const C = React.forwardRef<HTMLSpanElement, Props>(({ size = 24, className = '', style, strokeWidth, fill, fillOpacity, color, ...rest }, ref) => {
    const px = typeof size === 'number' ? size : parseFloat(String(size)) || 24;
    return (
      <span ref={ref} role="img" aria-hidden={rest['aria-label'] ? undefined : true} {...rest}
        className={`belluh-emoji inline-flex items-center justify-center shrink-0 leading-none select-none ${glyph ? 'font-sans font-bold' : ''} ${className}`}
        style={{ width: px, height: px, fontSize: glyph ? px * 0.82 : px * 0.86, color, ...style }}>
        {src ? <img src={src} alt="" draggable={false} style={{ width: '100%', height: '100%' }} /> : glyph ? emoji + T : emoji}
      </span>
    );
  });
  C.displayName = 'EmojiIcon';
  return C;
};

// Pictures
export const Activity = make('📈');
export const AlertCircle = make('⚠️');
export const Archive = make('🗄️');
export const Ban = make('🚫');
export const BarChart3 = make('📊');
export const Bell = make('🔔');
export const BellOff = make('🔕');
export const BookHeart = make('📖');
export const BookOpen = make('📚');
export const Brain = make('🧠');
export const Calendar = make('📅');
export const CalendarCheck = make('🗓️');
export const CalendarClock = make('⏰');
export const CalendarDays = make('📆');
export const CalendarPlus = make('📅');
export const Camera = make('📷');
export const Car = make('🚗');
export const CheckCircle2 = make('✅');
export const CheckSquare = make('☑️');
export const Clock = make('🕰️');
export const CloudRain = make('🌧️');
export const CloudSun = make('⛅');
export const Compass = make('🧭');
export const Copy = make('📋');
export const CreditCard = make('💳');
export const Download = make('📥');
export const Edit3 = make('✏️');
export const ExternalLink = make('↗', true);
export const Eye = make('👀');
export const EyeOff = make('🙈');
export const Facebook = make('📘');
export const FileText = make('📄');
export const Film = make('🎬');
export const Fingerprint = make('🧬');
export const Flame = make('🔥');
export const Flower2 = make('🌸');
export const Gift = make('🎁');
export const Globe = make('🌍');
export const Heart = make('💗');
export const History = make('🕰️');
export const Image = make('🖼️');
export const ImagePlus = make('📸');
export const Infinity = make('💞');
export const Info = make('💡');
export const Instagram = make('📸');
export const Lightbulb = make('💡');
export const Link = make('🔗');
export const Link2 = make('🔗');
export const Loader2 = make('⏳');
export const Lock = make('🔒');
export const LogOut = make('👋');
export const Mail = make('✉️');
export const MapPin = make('📍');
export const Maximize2 = make('⤢', true);
export const MessageCircle = make('💬');
export const MessageSquare = make('💬');
export const Mic = make('🎙️');
export const MoveDiagonal = make('⤡', true);
export const Palette = make('🎨');
export const PanelLeftClose = make('‹', true);
export const PanelLeftOpen = make('›', true);
export const Pause = make('⏸️');
export const PenLine = make('🖊️');
export const Pencil = make('✏️');
export const Phone = make('📞');
export const PhoneOff = make('📵');
export const PiggyBank = make('🐷');
export const Plane = make('✈️');
export const Play = make('▶️');
export const Quote = make('💭');
export const Receipt = make('🧾');
export const RefreshCw = make('🔄');
export const Send = make('📨');
export const Settings = make('⚙️');
export const Share2 = make('📤');
export const Shield = make('🛡️');
export const ShieldAlert = make('🚨');
export const ShoppingBag = make('🛍️');
export const ShoppingBasket = make('🧺');
export const Sparkles = make('✨');
export const Square = make('⏹️');
export const Star = make('⭐');
export const Sun = make('☀️');
export const Target = make('🎯');
export const Ticket = make('🎟️');
export const TrainFront = make('🚆');
export const Trash2 = make('🗑️');
export const TrendingUp = make('📈');
export const Trophy = make('🏆');
export const Twitter = make('🐦');
export const Upload = make('📤');
export const User = make('🙂');
export const UserPlus = make('🫶');
export const Users = make('🫂');
export const UtensilsCrossed = make('🍽️');
export const Wallet = make('👛');
export const Wand2 = make('🪄');
export const Waves = make('🌊');
export const Zap = make('⚡');

// Controls: punctuation, in the text color
export const ArrowLeft = make('←', true);
export const ArrowRight = make('→', true);
export const ArrowUp = make('↑', true);
export const ArrowUpRight = make('↗', true);
export const Check = make('✓', true);
export const ChevronDown = make('⌄', true);
export const ChevronLeft = make('‹', true);
export const ChevronRight = make('›', true);
export const Menu = make('☰', true);
export const Minus = make('−', true);
export const MoreHorizontal = make('⋯', true);
export const Plus = make('+', true);
export const X = make('✕', true);
