'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import EmptyState from '@/components/EmptyState';
import { friendlyError } from '@/lib/errorMessage';

type CSSVarStyle = React.CSSProperties & { '--tw-ring-color'?: string };

interface JobWithCompany {
  id: string;
  title: string;
  description: string;
  pay: string;
  job_type: string;
  location: string;
  shift_timing: string;
  workers_needed: number;
  created_at: string;
  companies: {
    name: string;
  };
  applications?: {
    id: string;
    status: string;
  }[];
}

const BRAND = '#00ADB5';
const BRAND_DARK = '#008C93';

const JOB_TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  'full-time':  { bg: '#EEEDFE', color: '#534AB7', label: 'Full-time' },
  'part-time':  { bg: '#E1F5EE', color: '#0F6E56', label: 'Part-time' },
  'contract':   { bg: '#FAEEDA', color: '#854F0B', label: 'Contract' },
  'temporary':  { bg: '#FAECE7', color: '#993C1D', label: 'Temporary' },
};

const SHIFT_LABELS: Record<string, string> = {
  morning:   'Morning',
  afternoon: 'Afternoon',
  evening:   'Evening',
  night:     'Night',
  flexible:  'Flexible',
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending:  { bg: '#FAEEDA', color: '#854F0B' },
  accepted: { bg: '#EAF3DE', color: '#3B6D11' },
  rejected: { bg: '#FCEBEB', color: '#A32D2D' },
};

export default function Jobs() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<JobWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');
  const [uniqueLocations, setUniqueLocations] = useState<string[]>([]);
  const [uniqueJobTypes, setUniqueJobTypes] = useState<string[]>([]);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Guest / employer query
      if (!user || profile?.role !== 'worker') {
        const { data, error } = await supabase
          .from('jobs')
          .select(`
            *,
            companies(name)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          setError(friendlyError(error, "We couldn't load jobs. Please try again."));
          return;
        }

        const processed = data || [];

        setJobs(processed);

        setUniqueLocations([
          ...new Set(processed.map(j => j.location).filter(Boolean))
        ]);

        setUniqueJobTypes([
          ...new Set(processed.map(j => j.job_type).filter(Boolean))
        ]);

        return;
      }

      // Worker query (only fetch THIS user's applications)
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          companies(name),
          applications(
            id,
            status,
            user_id
          )
        `)
        .eq('applications.user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        setError(friendlyError(error, "We couldn't load jobs. Please try again."));
        return;
      }

      const processed =
        data?.map(job => ({
          ...job,
          applications:
            job.applications?.filter(
              (app: { user_id: string }) => app.user_id === user.id
            ) || [],
        })) || [];

      setJobs(processed);

      setUniqueLocations([
        ...new Set(processed.map(j => j.location).filter(Boolean))
      ]);

      setUniqueJobTypes([
        ...new Set(processed.map(j => j.job_type).filter(Boolean))
      ]);

    } catch {
      setError("We couldn't load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount, not derived state
  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const filteredJobs = useMemo(() => {
    let filtered = jobs;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(j =>
        j.title.toLowerCase().includes(q) || j.companies?.name.toLowerCase().includes(q)
      );
    }
    if (selectedLocation) filtered = filtered.filter(j => j.location === selectedLocation);
    if (selectedJobType) filtered = filtered.filter(j => j.job_type === selectedJobType);
    return filtered;
  }, [jobs, searchTerm, selectedLocation, selectedJobType]);

  const handleApply = async (jobId: string) => {
    if (!user || profile?.role !== 'worker') { setError('Only helpers can apply for jobs'); return; }
    setApplying(jobId);
    try {
      const job = jobs.find(j => j.id === jobId);
      if (job?.applications && job.applications.length > 0) {
        setError('You have already applied for this job');
        setApplying(null);
        return;
      }
      const { error } = await supabase
        .from('applications')
        .insert({ job_id: jobId, user_id: user.id, status: 'pending' })
        .select().single();

      if (error) {
        setError(error.code === '23505' ? 'You have already applied for this job.' : friendlyError(error, "We couldn't submit your application. Please try again."));
        return;
      }
      await fetchJobs();
    } catch { setError("We couldn't submit your application. Please try again."); }
    finally { setApplying(null); }
  };

  const clearFilters = () => { setSearchTerm(''); setSelectedLocation(''); setSelectedJobType(''); };
  const hasFilters = searchTerm || selectedLocation || selectedJobType;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 py-10">
          {/* Hero Skeleton */}
          <div className="text-center mb-10 space-y-2 flex flex-col items-center">
            <div className="skeleton h-9 w-64 rounded-xl"></div>
            <div className="skeleton h-4 w-44 rounded-lg"></div>
          </div>

          {/* Search + Filter Bar Skeleton */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 shadow-sm">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="md:col-span-2 skeleton h-10 w-full rounded-xl"></div>
              <div className="skeleton h-10 w-full rounded-xl"></div>
              <div className="skeleton h-10 w-full rounded-xl"></div>
            </div>
          </div>

          {/* Cards Grid Skeleton */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="skeleton h-6 w-20 rounded-full"></div>
                  <div className="skeleton h-4 w-12 rounded"></div>
                </div>
                <div className="skeleton h-6 w-3/4 rounded-lg"></div>
                <div className="skeleton h-4 w-1/3 rounded"></div>
                <div className="skeleton h-12 w-full rounded-lg"></div>
                <div className="flex justify-between items-center pt-2">
                  <div className="skeleton h-5 w-24 rounded"></div>
                  <div className="skeleton h-5 w-16 rounded-lg"></div>
                </div>
                <div className="skeleton h-10 w-full rounded-xl mt-2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find your next role</h1>
          <p className="text-gray-500">Opportunities waiting for you</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm animate-error-shake">
            {error}
          </div>
        )}

        {/* Search + filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search job title or company..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full min-h-12 pl-9 pr-4 py-2.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50"
                style={{ '--tw-ring-color': BRAND } as CSSVarStyle}
              />
            </div>

            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              className="w-full min-h-12 px-3 py-2.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 text-gray-700"
            >
              <option value="">All locations</option>
              {uniqueLocations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            <select
              value={selectedJobType}
              onChange={e => setSelectedJobType(e.target.value)}
              className="w-full min-h-12 px-3 py-2.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 text-gray-700"
            >
              <option value="">All types</option>
              {uniqueJobTypes.map(t => (
                <option key={t} value={t}>{JOB_TYPE_STYLES[t]?.label || t}</option>
              ))}
            </select>
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="mt-3 flex flex-wrap gap-3 items-center">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  &ldquo;{searchTerm}&rdquo;
                  <button onClick={() => setSearchTerm('')} className="ml-1 p-2 -m-2 text-gray-400 hover:text-gray-700" aria-label="Clear search">×</button>
                </span>
              )}
              {selectedLocation && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {selectedLocation}
                  <button onClick={() => setSelectedLocation('')} className="ml-1 p-2 -m-2 text-gray-400 hover:text-gray-700" aria-label="Clear location filter">×</button>
                </span>
              )}
              {selectedJobType && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium" style={JOB_TYPE_STYLES[selectedJobType] ? { background: JOB_TYPE_STYLES[selectedJobType].bg, color: JOB_TYPE_STYLES[selectedJobType].color } : { background: '#f3f4f6', color: '#374151' }}>
                  {JOB_TYPE_STYLES[selectedJobType]?.label || selectedJobType}
                  <button onClick={() => setSelectedJobType('')} className="ml-1 p-2 -m-2 opacity-60 hover:opacity-100" aria-label="Clear job type filter">×</button>
                </span>
              )}
              <button onClick={clearFilters} className="tap-inline text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results count */}
        {!loading && filteredJobs.length > 0 && (
          <p className="text-sm text-gray-400 mb-4">{filteredJobs.length} {filteredJobs.length === 1 ? 'role' : 'roles'} found</p>
        )}

        {/* Empty state */}
        {filteredJobs.length === 0 ? (
          jobs.length === 0 ? (
            <EmptyState
              icon="search"
              title="No jobs available yet"
              description="New opportunities are posted regularly — check back soon."
            />
          ) : (
            <EmptyState
              icon="search"
              title="No jobs match your search"
              description="Try adjusting your filters or searching different terms."
              action={{ label: 'Clear filters', onClick: clearFilters }}
            />
          )
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map(job => {
              const hasApplied = job.applications && job.applications.length > 0;
              const typeStyle = JOB_TYPE_STYLES[job.job_type] || { bg: '#f3f4f6', color: '#374151', label: job.job_type };
              const appStatus = hasApplied ? job.applications![0].status : null;
              const statusStyle = appStatus ? STATUS_STYLES[appStatus] : null;

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col hover:border-gray-200 hover:shadow-md transition-all"
                >
                  {/* Top row — type badge */}
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ background: typeStyle.bg, color: typeStyle.color }}
                    >
                      {typeStyle.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-base font-semibold text-gray-900 mb-1 leading-snug">{job.title}</h2>

                  {/* Company */}
                  <p className="text-sm font-medium mb-0.5" style={{ color: BRAND }}>{job.companies?.name || 'Company'}</p>

                  {/* Location — truncated */}
                  <p className="text-xs text-gray-400 mb-3 truncate" title={job.location}>
                    {job.location}
                  </p>

                  {/* Description preview */}
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">
                    {job.description}
                  </p>

                  {/* Meta row */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{job.pay}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{SHIFT_LABELS[job.shift_timing] || job.shift_timing} shift</p>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                      {job.workers_needed} {job.workers_needed === 1 ? 'opening' : 'openings'}
                    </span>
                  </div>

                  {/* CTA */}
                  {user && profile?.role === 'worker' ? (
                    hasApplied ? (
                      <div
                        className="w-full min-h-12 flex items-center justify-center py-2.5 px-4 rounded-xl text-center text-sm font-medium"
                        style={{ background: statusStyle?.bg || '#f3f4f6', color: statusStyle?.color || '#374151' }}
                      >
                        Applied · {appStatus!.charAt(0).toUpperCase() + appStatus!.slice(1)}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApply(job.id)}
                        disabled={applying === job.id}
                        className="w-full min-h-12 py-2.5 px-4 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-60"
                        style={{ background: applying === job.id ? '#a8a4f0' : BRAND }}
                      >
                        {applying === job.id ? 'Applying...' : 'Apply now'}
                      </button>
                    )
                  ) : user ? (
                    <div className="w-full min-h-12 flex items-center justify-center bg-gray-50 text-gray-400 py-2.5 px-4 rounded-xl text-center text-sm">
                      Only helpers can apply
                    </div>
                  ) : (
                    <button
                      onClick={() => window.location.href = '/login'}
                      className="w-full min-h-12 py-2.5 px-4 rounded-xl text-sm font-medium text-white transition-all"
                      style={{ background: BRAND }}
                      onMouseEnter={e => (e.currentTarget.style.background = BRAND_DARK)}
                      onMouseLeave={e => (e.currentTarget.style.background = BRAND)}
                    >
                      Log in to apply
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}