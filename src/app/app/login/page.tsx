'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { friendlyError } from '@/lib/errorMessage';
import { useMounted } from '@/lib/useMounted';

export default function Login() {
  const { user, authInitialized } = useAuth();

  const mounted = useMounted();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  const router = useRouter();

  // Redirect if already logged in - Disabled during development for easier account switching
  useEffect(() => {
    if (
      process.env.NODE_ENV === 'production' &&
      mounted &&
      authInitialized &&
      user &&
      !redirecting
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronizing with the router (an external system), guards against a double navigation
      setRedirecting(true);
      router.push('/app/dashboard');
    }
  }, [mounted, authInitialized, user, redirecting, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setError(friendlyError(error, "We couldn't sign you in. Please try again."));
        setSubmitting(false);
        return;
      }

      router.push('/app/dashboard');

    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  // Prevent prerender mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary to-primary-dark"></div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="page-container w-full space-y-6">
            <div className="text-center mb-10 space-y-2 flex flex-col items-center">
              <div className="skeleton h-10 w-36 rounded-xl"></div>
              <div className="skeleton h-4 w-56 rounded"></div>
            </div>
            <div className="card-surface p-8 space-y-5">
              <div className="text-center space-y-2 flex flex-col items-center mb-6">
                <div className="skeleton h-7 w-40 rounded-lg"></div>
                <div className="skeleton h-4 w-32 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="skeleton h-4 w-24 rounded"></div>
                <div className="skeleton h-12 w-full rounded-xl"></div>
              </div>
              <div className="space-y-2">
                <div className="skeleton h-4 w-20 rounded"></div>
                <div className="skeleton h-12 w-full rounded-xl"></div>
              </div>
              <div className="skeleton h-12 w-full rounded-xl pt-2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Accent Strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary to-primary-dark"></div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="page-container w-full animate-fade-in-up">
          
          {/* Brand Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-primary tracking-tight mb-2">CareLink</h1>
            <p className="text-foreground/70 font-medium tracking-wide text-sm uppercase">Companionship & Assistance, Simplified</p>
          </div>

          <div className="card-surface p-8">

            {/* Heading */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground">
                Welcome back
              </h2>
              <p className="text-foreground/60 mt-1.5">
                Sign in to continue
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm animate-error-shake">
                {error}
              </div>
            )}

            {/* Account Switch Button */}
            {user && (
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.reload();
                }}
                className="mb-4 w-full border border-red-200 text-red-600 py-3 rounded-xl font-medium hover:bg-red-50"
              >
                Sign Out Current Account
              </button>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground/80 mb-1"
                >
                  Email address
                </label>

                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground/80 mb-1"
                >
                  Password
                </label>

                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Your password"
                  autoComplete="current-password"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || redirecting}
                className="btn-primary mt-2"
              >
                {submitting || redirecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

            </form>

          </div>

          {/* Footer */}
          <div className="mt-8 text-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <p className="text-foreground/60 font-medium">
              Don&apos;t have an account?{' '}
              <a
                href="/app/signup"
                className="text-primary hover:text-primary-dark font-bold ml-1 transition-colors"
              >
                Create account
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}