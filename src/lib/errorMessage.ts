// Converts raw Supabase/Postgres/network errors into short, friendly copy.
// Never surface error.message directly in the UI — it can leak DB/API internals.

export function friendlyError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const raw =
    typeof error === 'string'
      ? error
      : (error as { message?: string } | null | undefined)?.message || '';
  const code = (error as { code?: string } | null | undefined)?.code;

  if (code === '23505' || /duplicate key/i.test(raw)) {
    return "That already exists. Please use something different.";
  }
  if (/row-level security|permission denied|not authorized/i.test(raw)) {
    return "You don't have permission to do that.";
  }
  if (/invalid login credentials/i.test(raw)) {
    return 'Incorrect email or password. Please try again.';
  }
  if (/user already registered/i.test(raw)) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (/email not confirmed/i.test(raw)) {
    return 'Please confirm your email before signing in.';
  }
  if (/failed to fetch|network|fetch failed/i.test(raw)) {
    return "We couldn't connect. Please check your internet connection and try again.";
  }
  if (/jwt|token|session/i.test(raw)) {
    return 'Your session has expired. Please sign in again.';
  }

  return fallback;
}
