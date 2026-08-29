import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';

import { Button } from '../components/ui/Button.jsx';
import { Field, Input } from '../components/ui/Field.jsx';
import { useAuth } from '../hooks/auth-context.js';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signIn({ email, password });
      navigate('/', { replace: true });
    } catch (submitError) {
      // The API deliberately returns the same message for an unknown address
      // and a wrong password, so it is safe to show verbatim.
      setError(submitError.message ?? 'Could not sign in');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-lg font-bold text-white">
              V
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Sign in</h1>
            <p className="mt-1.5 text-sm text-ink-500">
              Administrator access to the Vibe control centre.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                invalid={Boolean(error)}
              />
            </Field>

            <Field label="Password" htmlFor="password">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your password"
                  className="pr-11"
                  invalid={Boolean(error)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            {error && (
              <div role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" icon={LogIn} isLoading={isSubmitting} className="w-full">
              Sign in
            </Button>
          </form>

          <p className="mt-6 flex items-start gap-2 text-xs text-ink-500">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Only administrator accounts can sign in here. Attempts are rate limited and recorded.
          </p>
        </div>
      </div>

      {/* Decorative panel. Hidden below lg so the form owns the small screen. */}
      <div className="relative hidden overflow-hidden bg-ink-900 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,78,136,0.35),transparent_55%),radial-gradient(circle_at_75%_75%,rgba(124,77,255,0.35),transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-end p-12">
          <blockquote className="max-w-md">
            <p className="text-2xl font-medium leading-snug text-white">
              Pricing, colours and moderation — all of it changes from here, without a release.
            </p>
            <footer className="mt-5 text-sm text-ink-400">
              Everything you change takes effect in the app immediately.
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
