'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { friendlyError } from '@/lib/errorMessage';

export const dynamic = 'force-dynamic';

export default function CreateCompanyPage() {
  const { user, profile, loading, authInitialized } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    company_type: '',
    location: '',
    description: '',
  });

  // Fix 1: Renamed to avoid naming conflict
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checkingCompany, setCheckingCompany] = useState(true);
  const [hasCompany, setHasCompany] = useState(false);

  // Handle authentication and redirect
  useEffect(() => {
    if (loading || !authInitialized) {
      return;
    }

    if (!user) {
      router.push('/app/login');
      return;
    }

    // Redirect workers away from this page
    if (profile && profile.role !== 'employer') {
      router.push('/app/dashboard');
      return;
    }

    // Check if user already has a company
    const checkExistingCompany = async () => {
      if (!user) return;
      
      try {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (companyData) {
          setHasCompany(true);
          setFormData({
            name: companyData.name || '',
            company_type: companyData.company_type || '',
            location: companyData.location || '',
            description: companyData.description || '',
          });
        }
      } catch (err) {
        console.error('Error checking company:', err);
      } finally {
        setCheckingCompany(false);
      }
    };

    if (profile && profile.role === 'employer') {
      checkExistingCompany();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- no company to check for a non-employer, so the loading flag just clears
      setCheckingCompany(false);
    }
  }, [user, profile, loading, authInitialized, router]);

  // Show loading while checking auth, profile, and company
  // Fix 5: Also wait for profile to arrive — prevents blank page race condition
  // when authInitialized becomes true before fetchProfile completes
  if (loading || !authInitialized || !profile || checkingCompany) {
    return (
      <div className="min-h-screen bg-background">
        <div className="page-container space-y-6">
          <div className="page-header text-center space-y-3 flex flex-col items-center">
            <div className="skeleton w-24 h-24 rounded-full"></div>
            <div className="skeleton h-8 w-44 rounded-xl"></div>
            <div className="skeleton h-4 w-60 rounded"></div>
          </div>
          <div className="card-surface p-5 space-y-5">
            <div className="space-y-2">
              <div className="skeleton h-4 w-28 rounded"></div>
              <div className="skeleton h-12 w-full rounded-xl"></div>
            </div>
            <div className="space-y-2">
              <div className="skeleton h-4 w-28 rounded"></div>
              <div className="skeleton h-12 w-full rounded-xl"></div>
            </div>
            <div className="space-y-2">
              <div className="skeleton h-4 w-24 rounded"></div>
              <div className="skeleton h-12 w-full rounded-xl"></div>
            </div>
            <div className="space-y-2">
              <div className="skeleton h-4 w-36 rounded"></div>
              <div className="skeleton h-24 w-full rounded-xl"></div>
            </div>
            <div className="skeleton h-12 w-full rounded-xl pt-2"></div>
          </div>
        </div>
      </div>
    );
  }

  // Prevent rendering if not employer (though redirect should handle it)
  if (!user || profile?.role !== 'employer') {
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setIsSubmitting(true);
    setError('');

    try {
      if (hasCompany) {
        const { error: updateError } = await supabase
          .from('companies')
          .update({
            name: formData.name.trim(),
            company_type: formData.company_type,
            location: formData.location.trim(),
            description: formData.description.trim(),
          })
          .eq('owner_id', user.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('companies')
          .insert({
            owner_id: user.id,
            name: formData.name.trim(),
            company_type: formData.company_type,
            location: formData.location.trim(),
            description: formData.description.trim(),
          });

        if (insertError) throw insertError;
      }

      // Success - redirect immediately
      router.push('/app/candidates');

    } catch (err) {
      console.error('Submit error:', err);
      setError(friendlyError(err, "We couldn't save your company profile. Please try again."));
    } finally {
      // Always reset submitting state so button is never permanently disabled
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container">

        {/* Header */}
        <div className="page-header text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-5xl text-white shadow-lg ring-4 ring-white mb-4">
            🏢
          </div>
          <h1 className="page-title">
            {hasCompany ? 'Edit Profile' : 'Set Up Your Profile'}
          </h1>
          <p className="page-subtitle">
            {hasCompany 
              ? 'Keep your profile up to date so helpers know who you are.' 
              : 'Tell helpers a bit about yourself. This only takes a moment.'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl font-medium animate-fade-in-up">
            {error}
          </div>
        )}

        {/* Form Card */}
        <div className="card-surface p-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Profile Name */}
            <div>
              <label className="block mb-1.5 text-sm font-bold text-foreground">
                Your name or business name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="e.g. The Sharma Family, Sunrise Hotel"
                autoComplete="organization"
              />
              <p className="mt-1.5 text-xs text-foreground/45">Helpers will see this name when you reach out to them.</p>
            </div>

            {/* Business Type */}
            <div>
              <label className="block mb-1.5 text-sm font-bold text-foreground">
                Business Type *
              </label>
              <select
                name="company_type"
                value={formData.company_type}
                onChange={handleChange}
                required
                className="input-field bg-white"
              >
                <option value="">Select your business type...</option>
                <option value="Hotel">Hotel</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Cafe">Cafe</option>
                <option value="Catering">Catering</option>
                <option value="Event Venue">Event Venue</option>
                <option value="Cloud Kitchen">Cloud Kitchen</option>
                <option value="Bar">Bar</option>
                <option value="Resort">Resort</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block mb-1.5 text-sm font-bold text-foreground">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="e.g. Hyderabad, Banjara Hills"
                autoComplete="address-level2"
              />
              <p className="mt-1.5 text-xs text-foreground/45">Helps helpers nearby find and connect with you.</p>
            </div>

            {/* Description */}
            <div>
              <label className="block mb-1.5 text-sm font-bold text-foreground">
                About You <span className="font-normal text-foreground/40">(optional)</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="input-field resize-none"
                placeholder="Briefly describe what kind of help you're looking for, your schedule, or anything else helpers should know..."
              />
            </div>

            {/* Info Box */}
            <div className="bg-primary/5 rounded-xl p-4 flex gap-3 items-start">
              <span className="text-primary text-lg mt-0.5">💡</span>
              <div>
                <p className="font-bold text-primary text-sm">
                  {hasCompany ? 'Tip' : 'What happens next?'}
                </p>
                <p className="text-sm text-foreground/60 mt-0.5 font-medium">
                  {hasCompany
                    ? 'A complete profile makes it easier for helpers to trust and connect with you.'
                    : 'Once saved, you can browse available helpers and send them a help request directly from the app.'}
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {hasCompany ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {hasCompany ? 'Update Profile' : 'Create Profile'}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}