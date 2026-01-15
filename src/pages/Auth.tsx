import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Lock, Eye, EyeOff, Check } from 'lucide-react';
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
            setLoading(false);
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
      setLoading(false);
    }
  };

  const RequirementItem = ({ met, text }: { met: boolean, text: string }) => (
      <div className={`flex items-center gap-2 text-xs transition-colors duration-300 ${met ? 'text-green-600' : 'text-slate-400'}`}>
          {met ? <Check size={12} strokeWidth={3} /> : <div className="w-3 h-3 rounded-full border border-slate-300"></div>}
          <span className="font-medium">{text}</span>
      </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-6 relative overflow-hidden">
       {/* Background Ambience */}
       <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-belluh-50/50 rounded-full blur-[120px] pointer-events-none"></div>

       <div className="w-full max-w-sm relative z-10 animate-slide-up">
          <div className="flex flex-col items-center mb-10">
             <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-slate-200">
                <Sparkles size={24} />
             </div>
             <h1 className="text-3xl font-serif text-slate-900 mb-2 tracking-tight">
                {isSignUp ? "Create Account" : "Welcome Back"}
             </h1>
             <p className="text-slate-500 text-sm font-medium">Your adaptive AI love journal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 ml-1">Email address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-belluh-100 focus:border-belluh-300 transition-all shadow-sm"
                  autoFocus
                  required
                />
             </div>
             
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 ml-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-belluh-100 focus:border-belluh-300 transition-all shadow-sm pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Readable Password Requirements */}
                {isSignUp && (
                    <div className="pt-3 px-1 grid grid-cols-2 gap-2 animate-fade-in">
                        <RequirementItem met={hasLower} text="Lowercase (a-z)" />
                        <RequirementItem met={hasUpper} text="Uppercase (A-Z)" />
                        <RequirementItem met={hasNumber} text="Number (0-9)" />
                        <RequirementItem met={hasMinLength} text="6+ Characters" />
                    </div>
                )}
             </div>
             
             <button 
                type="submit" 
                disabled={loading || !email || !password || (isSignUp && !isPasswordValid)}
                className="w-full bg-slate-900 text-white rounded-xl py-3.5 font-bold text-sm hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
             >
                {loading && !email.includes('google') ? ( // Simple check to show spinner on correct button
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                    <>
                        <span>{isSignUp ? "Sign Up" : "Log In"}</span>
                        <ArrowRight size={16} />
                    </>
                )}
             </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                  <span className="bg-[#fcfcfc] px-2 text-slate-400 font-medium uppercase tracking-wider">Or</span>
              </div>
          </div>

          {/* Google Button */}
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-slate-700 border border-slate-200 rounded-xl py-3.5 font-bold text-sm hover:bg-slate-50 transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-sm disabled:opacity-70"
          >
             <GoogleIcon />
             <span>Continue with Google</span>
          </button>

          {isSignUp && (
              <p className="text-center text-[10px] text-slate-400 mt-6 leading-relaxed">
                  By creating an account, you agree to our <button type="button" onClick={() => onShowLegal('tos')} className="font-bold hover:text-slate-700 underline decoration-slate-300 underline-offset-2 transition-colors">Terms of Service</button> and <button type="button" onClick={() => onShowLegal('privacy')} className="font-bold hover:text-slate-700 underline decoration-slate-300 underline-offset-2 transition-colors">Privacy Policy</button>.
              </p>
          )}

          <div className="mt-6 text-center">
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors"
              >
                  {isSignUp ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
              </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 opacity-60">
             <Lock size={12} className="text-slate-400" />
             <p className="text-[10px] text-slate-400 font-medium">End-to-end encrypted. Private by default.</p>
          </div>
       </div>
    </div>
  );
};

export default Auth;