import React, { useState, useEffect } from 'react';
import { ArrowRight, Lock, Eye, EyeOff, Check } from 'lucide-react';
import BelluhOrb from '../components/BelluhOrb';
import BelluhSpeech from '../components/BelluhSpeech';
import { belluh } from '../lib/belluhPresence';
import { supabase } from '../lib/supabaseClient';

interface AuthProps {
  onLogin: () => void;
  onShowLegal: (type: 'tos' | 'privacy') => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  initialView?: 'login' | 'signup';
}

// Inline Google Logo for self-containment
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const Auth: React.FC<AuthProps> = ({ onLogin, onShowLegal, onShowToast, initialView = 'signup' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(initialView === 'signup');
  
  // Update state when initialView changes
  useEffect(() => {
      setIsSignUp(initialView === 'signup');
  }, [initialView]);
  
  // Requirement States
  const hasMinLength = password.length >= 6;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const isPasswordValid = hasMinLength && hasLower && hasUpper && hasNumber;

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      // Preserve existing query parameters (like ?invite=123)
      const redirectUrl = new URL(window.location.origin);
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.forEach((value, key) => {
          redirectUrl.searchParams.append(key, value);
      });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectUrl.toString()
        }
      });
      if (error) throw error;
    } catch (error: any) {
      onShowToast(error.message || 'Google login failed', 'error');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    if (isSignUp && !isPasswordValid) {
        onShowToast("Please meet all password requirements.", "error");
        return;
    }

    setLoading(true);
    const release = belluh.holdThinking();

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        
        // Supabase Security Pattern: If identities is empty, user exists but hidden.
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            setIsSignUp(false); 
            onShowToast("Account exists. Please log in.", "info");
            return;
        }
        
        // Successful Sign Up
        if (data.user && (!data.user.identities || data.user.identities.length > 0)) {
            // Create basic profile
            await supabase.from('profiles').insert([
                { 
                  id: data.user.id, 
                  email: data.user.email, 
                  full_name: email.split('@')[0], 
                  avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
                  journal_streak: 0
                }
            ]);
            onShowToast('Account created! Please log in.', 'success');
            setIsSignUp(false); 
        }
      } else {
        // Login Flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLogin();
      }
    } catch (error: any) {
      onShowToast(error.message || 'Authentication failed', 'error');
    } finally {
      release();
      setLoading(false);
    }
  };

  const Requirement = ({ met, text }: { met: boolean; text: string }) => (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors duration-300 ${met ? 'text-[#3f7486]' : 'text-slate-400'}`}>
      <Check size={13} strokeWidth={3} className={`transition-opacity duration-300 ${met ? 'opacity-100' : 'opacity-25'}`} />
      {text}
    </span>
  );

  const type = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => { set(e.target.value); belluh.key(); };
  const line = isSignUp ? "Write a few lines. I'll remember the rest." : 'Welcome back. I kept your place.';
  const field = 'w-full bg-white/90 border border-slate-200/80 rounded-2xl px-4 py-3.5 text-[16px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#CDE9F2]/70 focus:border-[#9bbecb] transition-all';

  return (
    <div className="min-h-[100svh] bg-[#fcfcfc] md:grid md:grid-cols-[1.05fr_1fr] relative overflow-hidden">
      <div className="absolute -top-40 -left-32 w-[560px] h-[560px] rounded-full bg-[#CDE9F2]/60 blur-[120px] pointer-events-none animate-float"></div>
      <div className="absolute -bottom-48 -right-24 w-[520px] h-[520px] rounded-full bg-[#f0addd]/25 blur-[120px] pointer-events-none animate-pulse-slow"></div>
      {/* Belluh's side: the living water, saying hello */}
      <div className="relative flex flex-col items-center justify-center px-6 pt-12 pb-4 md:p-12 md:bg-gradient-to-br md:from-[#eef7fa] md:via-white md:to-[#fdf2f9] md:overflow-hidden">
        <div className="relative flex flex-col items-center text-center animate-slide-up">
          <div className="relative">
            <div className="absolute inset-[-25%] rounded-full bg-[radial-gradient(circle,rgba(205,233,242,0.9)_0%,rgba(205,233,242,0)_65%)] blur-2xl pointer-events-none"></div>
            <span className="md:hidden"><BelluhOrb size={92} onTap={() => {}} label="Belluh" /></span>
            <span className="hidden md:inline-flex"><BelluhOrb size={230} onTap={() => {}} label="Belluh" /></span>
          </div>
          <p className="mt-4 md:mt-8 min-h-[1.75rem] font-serif text-lg md:text-2xl text-slate-600 max-w-xs md:max-w-sm" aria-live="polite">
            <BelluhSpeech key={line} text={line} delay={400} />
          </p>
          <p className="hidden md:block mt-10 font-serif text-4xl lg:text-5xl leading-[1.1] tracking-tight">
            <span className="text-[#9bbecb]">Your story,</span><br /><span className="text-[#f0addd] italic">kept between you.</span>
          </p>
        </div>
      </div>

      {/* The form */}
      <div className="relative flex items-start md:items-center justify-center px-6 pb-10 pt-4 md:p-12">
        <div className="w-full max-w-sm animate-slide-up">
          <h1 className="text-3xl md:text-4xl font-serif text-slate-900 mb-2 tracking-tight">
            {isSignUp ? 'Start your story.' : 'Welcome back.'}
          </h1>
          <p className="text-slate-500 mb-7">{isSignUp ? 'Free to start. Bring your partner whenever you’re ready.' : 'Pick up where the two of you left off.'}</p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-slate-700 border border-slate-200 rounded-2xl py-3.5 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-sm disabled:opacity-70"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 my-6 text-xs font-bold uppercase tracking-widest text-slate-300">
            <span className="h-px flex-1 bg-slate-200"></span>or with email<span className="h-px flex-1 bg-slate-200"></span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="auth-email" className="text-xs font-bold text-slate-700 ml-1">Email</label>
              <input id="auth-email" type="email" autoComplete="email" value={email} onChange={type(setEmail)} placeholder="name@example.com" className={field} autoFocus required />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="auth-password" className="text-xs font-bold text-slate-700 ml-1">Password</label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={type(setPassword)}
                  placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
                  className={`${field} pr-12`}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {isSignUp && (
                <div className="pt-2 px-1 flex flex-wrap gap-x-4 gap-y-1.5 animate-fade-in">
                  <Requirement met={hasMinLength} text="6+ characters" />
                  <Requirement met={hasLower} text="Lowercase" />
                  <Requirement met={hasUpper} text="Uppercase" />
                  <Requirement met={hasNumber} text="A number" />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password || (isSignUp && !isPasswordValid)}
              className="w-full bg-[#f0addd] text-white rounded-full py-4 font-bold text-sm hover:bg-[#e57ec3] transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-[#f0addd]/30 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed !mt-6"
            >
              {loading ? <span>{isSignUp ? 'Creating your account...' : 'Logging you in...'}</span> : <><span>{isSignUp ? 'Create account' : 'Log in'}</span><ArrowRight size={16} /></>}
            </button>
          </form>

          {isSignUp && (
            <p className="text-center text-xs text-slate-400 mt-5 leading-relaxed">
              By creating an account, you agree to our <button type="button" onClick={() => onShowLegal('tos')} className="font-bold hover:text-slate-700 underline decoration-slate-300 underline-offset-2">Terms</button> and <button type="button" onClick={() => onShowLegal('privacy')} className="font-bold hover:text-slate-700 underline decoration-slate-300 underline-offset-2">Privacy Policy</button>.
            </p>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            {isSignUp ? 'Already have an account?' : 'New to Belluh?'}{' '}
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="font-bold text-slate-900 hover:text-[#f0addd] transition-colors">
              {isSignUp ? 'Log in' : 'Create an account'}
            </button>
          </p>

          <p className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Lock size={12} />
            Private entries stay yours. Encrypted in storage and in transit.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
