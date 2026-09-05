import { useState, type FormEvent } from 'react';
import { X, Mail, Lock, Sparkles, AlertCircle, ArrowRight, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { 
  loginWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  resetPasswordWithEmail,
  loginAsGuestEvaluator,
  getFirebaseAuthErrorMessage 
} from '../services/firebase';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type AuthMode = 'signin' | 'register' | 'forgot-password';

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (mode === 'forgot-password') {
      setLoading(true);
      try {
        await resetPasswordWithEmail(trimmedEmail);
        setSuccessMessage(`Password reset link sent to ${trimmedEmail}. Please check your inbox.`);
      } catch (err: any) {
        setError(getFirebaseAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter your password.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        await registerWithEmail(trimmedEmail, password, name.trim() || undefined);
      } else {
        await loginWithEmail(trimmedEmail, password);
      }
      onSuccess();
    } catch (err: any) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onSuccess();
    } catch (err: any) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      await loginAsGuestEvaluator();
      onSuccess();
    } catch (err: any) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="auth-modal"
        className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
      >
        <button
          id="auth-btn-close"
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#94A3B8] hover:text-[#0F1B3D] rounded-lg hover:bg-[#F8FAFC] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#0F1B3D] text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Sparkles className="w-5 h-5 text-[#10B981]" />
          </div>
          <h2 className="text-xl font-bold text-[#0F1B3D]">
            {mode === 'register'
              ? 'Create your Pulse Account'
              : mode === 'forgot-password'
              ? 'Reset Your Password'
              : 'Welcome to Pulse'}
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            {mode === 'forgot-password'
              ? 'Enter your registered email to receive a secure recovery link.'
              : 'Personalized market intelligence isolating your personal last-seen baseline.'}
          </p>
        </div>

        {/* Tab switcher between Sign In and Create Account */}
        {mode !== 'forgot-password' && (
          <div className="mb-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#065F46] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                Instant Access (No Setup Required)
              </span>
              <span className="text-[10px] bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] font-bold px-2 py-0.5 rounded-md">
                Active & Ready
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] mb-2.5 leading-relaxed">
              Launch the full market intelligence workspace immediately with persistent watchlists and baseline tracking — no Google Cloud IAM owner permissions required.
            </p>
            <button
              id="auth-btn-guest-top"
              type="button"
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full text-xs font-bold py-2.5 px-4 rounded-lg bg-[#0F1B3D] hover:bg-[#18264D] text-white shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-[#10B981]" />
              <span>Launch 1-Click Instant Preview</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto text-[#94A3B8]" />
            </button>
          </div>
        )}

        {mode !== 'forgot-password' && (
          <div className="relative my-3.5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E2E8F0]" />
            </div>
            <span className="relative bg-white px-3 text-[11px] text-[#64748B] uppercase font-bold tracking-wider">
              Or personalize with email
            </span>
          </div>
        )}

        {mode !== 'forgot-password' && (
          <div className="flex bg-[#F1F5F9] p-1 rounded-xl mb-4 text-xs font-semibold">
            <button
              id="auth-tab-signin"
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white text-[#0F1B3D] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F1B3D]'
              }`}
            >
              Sign In
            </button>
            <button
              id="auth-tab-register"
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white text-[#0F1B3D] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F1B3D]'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 text-xs font-semibold text-[#DC2626] bg-[#FEF2F2] border border-red-200 rounded-xl p-3 flex flex-col gap-2.5 animate-in fade-in duration-150">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626] mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-[#0F1B3D] text-white hover:bg-[#18264D] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Continue with Instant Preview Access</span>
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 text-xs font-semibold text-[#065F46] bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3 flex items-start gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#10B981] mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Primary Email & Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                <input
                  id="auth-input-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ananya Sharma"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2 pl-9 pr-3 text-sm text-[#0F1B3D] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
              <input
                id="auth-input-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ananya@example.com"
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2 pl-9 pr-3 text-sm text-[#0F1B3D] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B82F6]"
              />
            </div>
          </div>

          {mode !== 'forgot-password' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#0F1B3D]">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot-password');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] font-semibold text-[#3B82F6] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                <input
                  id="auth-input-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2 pl-9 pr-10 text-sm text-[#0F1B3D] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B82F6]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#0F1B3D]"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                <input
                  id="auth-input-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2 pl-9 pr-3 text-sm text-[#0F1B3D] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
            </div>
          )}

          <button
            id="auth-btn-submit"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#0F1B3D] hover:bg-[#18264D] text-white font-bold text-xs shadow-xs transition-colors mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Processing...</span>
            ) : mode === 'register' ? (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : mode === 'forgot-password' ? (
              <span>Send Recovery Link</span>
            ) : (
              <>
                <span>Sign In with Email</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {mode === 'forgot-password' ? (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-xs font-bold text-[#3B82F6] hover:underline"
            >
              ← Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E2E8F0]" />
              </div>
              <span className="relative bg-white px-3 text-[11px] text-[#64748B] uppercase font-bold tracking-wider">
                Or alternate options
              </span>
            </div>

            {/* Quick Access Options */}
            <div className="space-y-2">
              <button
                id="auth-btn-google"
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F1B3D] font-semibold text-xs shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                id="auth-btn-guest"
                type="button"
                onClick={handleGuestLogin}
                disabled={loading}
                className="w-full text-xs font-semibold py-2.5 px-4 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F1B3D] border border-[#E2E8F0] shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-[#10B981]" />
                <span>1-Click Instant Preview Access</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
