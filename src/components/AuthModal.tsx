import { useState, type FormEvent } from 'react';
import { X, Mail, Lock, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { loginWithGoogle, loginWithEmail, registerWithEmail, loginAsGuestEvaluator } from '../services/firebase';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginAsGuestEvaluator();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="auth-modal"
        className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#94A3B8] hover:text-[#0F1B3D] rounded-lg hover:bg-[#F8FAFC] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#0F1B3D] text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Sparkles className="w-5 h-5 text-[#10B981]" />
          </div>
          <h2 className="text-xl font-bold text-[#0F1B3D]">
            {isRegister ? 'Create your Pulse Account' : 'Welcome to Pulse'}
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Personalized market intelligence isolating your personal last-seen baseline.
          </p>
        </div>

        {error && (
          <div className="mb-4 text-xs font-semibold text-[#DC2626] bg-[#FEF2F2] border border-red-200 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626] mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Fast Workspace Access */}
        <div className="mb-4">
          <button
            id="auth-btn-guest"
            type="button"
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full text-xs font-bold py-2.5 px-4 rounded-xl bg-[#0F1B3D] hover:bg-[#18264D] text-white shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#10B981]" />
            <span>1-Click Instant Preview Access</span>
          </button>
        </div>

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E2E8F0]" />
          </div>
          <span className="relative bg-white px-3 text-[11px] text-[#64748B] uppercase font-bold tracking-wider">
            Or continue with email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
              <input
                id="auth-input-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ananya@example.com"
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2 pl-9 pr-3 text-sm text-[#0F1B3D] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B82F6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
              <input
                id="auth-input-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2 pl-9 pr-3 text-sm text-[#0F1B3D] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B82F6]"
              />
            </div>
          </div>

          <button
            id="auth-btn-submit"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F1B3D] font-bold text-xs shadow-2xs transition-colors mt-2"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-[#E2E8F0] text-center text-xs text-[#64748B]">
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="font-bold text-[#3B82F6] hover:underline ml-1"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="font-bold text-[#3B82F6] hover:underline ml-1"
              >
                Create one now
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
