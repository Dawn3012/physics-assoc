'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ImageUploader from '@/components/ImageUploader';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import EventCard from '@/components/EventCard';
import { fetchEventById, updateEventById, checkAdminSession } from '@/lib/eventsStorage';
import { EventItem } from '@/lib/types';
import toast from 'react-hot-toast';

function EditEventForm() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get('demo') === 'true';
  const eventId = params?.id as string;

  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Observation & Stargazing');
  const [status, setStatus] = useState<'upcoming' | 'past' | 'ongoing'>('upcoming');
  const [registrationUrl, setRegistrationUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const isAuth = await checkAdminSession(isDemo);
    if (!isAuth) {
      router.push('/admin');
      return;
    }
    setAuthenticated(true);
    loadEvent();
  }

  async function loadEvent() {
    if (!eventId) return;
    setLoading(true);

    const ev = await fetchEventById(eventId);
    if (!ev) {
      toast.error('Event not found');
      router.push('/admin/events');
      return;
    }

    setTitle(ev.title || '');
    setSlug(ev.slug || '');
    try {
      const d = new Date(ev.date);
      if (!isNaN(d.getTime())) {
        setDate(d.toISOString().split('T')[0]);
      } else {
        setDate(ev.date || '');
      }
    } catch {
      setDate(ev.date || '');
    }

    setTime(ev.time || '');
    setLocation(ev.location || '');
    setCategory(ev.category || 'General');
    setStatus(ev.status || 'upcoming');
    setRegistrationUrl(ev.registration_url || '');
    setImageUrl(ev.image_url || '');
    setDescription(ev.description || '');
    setPublished(ev.published ?? true);

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter an event title');
      return;
    }
    if (!slug.trim()) {
      toast.error('Please enter a valid slug');
      return;
    }
    if (!date) {
      toast.error('Please specify the event date');
      return;
    }
    if (!location.trim()) {
      toast.error('Please specify the event venue / location');
      return;
    }

    setSaving(true);

    try {
      const { error } = await updateEventById(eventId, {
        title: title.trim(),
        slug: slug.trim(),
        date: new Date(date).toISOString(),
        time: time.trim(),
        location: location.trim(),
        category: category.trim(),
        status,
        registration_url: registrationUrl.trim(),
        image_url: imageUrl.trim(),
        description: description.trim(),
        published,
      });

      if (error) {
        toast.error('Failed to update event: ' + error.message);
        setSaving(false);
        return;
      }

      toast.success(published ? 'Event updated and published!' : 'Draft event updated!');
      router.push(isDemo ? '/demo?tab=events' : '/admin?tab=events');
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong');
      setSaving(false);
    }
  }

  const previewEvent: EventItem = {
    id: eventId,
    title: title || 'Untitled Event',
    slug: slug || 'event-slug',
    description: description || 'Write a description to see how it looks here.',
    date: date ? new Date(date).toISOString() : new Date().toISOString(),
    time: time || '',
    location: location || '',
    image_url: imageUrl,
    category,
    status,
    registration_url: registrationUrl,
    published,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let formattedDate = previewEvent.date;
  try {
    const d = new Date(previewEvent.date);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  } catch {}

  if (!authenticated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-prussian border-t-orange rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 pb-24 text-gray-200">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href={isDemo ? '/demo?tab=events' : '/admin?tab=events'}
              className="text-gray-400 hover:text-orange transition-colors text-sm mb-2 inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Events
            </Link>
            <h1 className="text-3xl font-bold text-white">Edit Event</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                showPreview
                  ? 'bg-orange text-white'
                  : 'bg-prussian/40 hover:bg-prussian/60 border border-prussian/50 text-gray-300'
              }`}
            >
              <span>👁️</span>
              {showPreview ? 'Back to Form' : 'Preview How It Will Look'}
            </button>
          </div>
        </div>

        {showPreview ? (
          /* Full Website Draft Preview */
          <div className="space-y-8">
            <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-5 py-4 rounded-xl flex items-center justify-between text-sm">
              <div>
                <p className="font-bold">👁️ Draft Preview: Exact Website Display</p>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  This shows exactly how your event will look both on the main Events grid and on the individual Event Detail page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-4 py-1.5 bg-amber-500 text-black font-semibold rounded text-xs hover:bg-amber-400 transition-colors shrink-0"
              >
                Back to Edit
              </button>
            </div>

            {/* View 1: Event Card Preview */}
            <div className="p-6 rounded-2xl border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
              <div className="mb-4">
                <span className="text-xs uppercase tracking-widest font-yanone text-accent">Preview: Events Page Grid Card</span>
              </div>
              <div className="max-w-md">
                <EventCard event={previewEvent} />
              </div>
            </div>

            {/* View 2: Full Event Detail Page Preview */}
            <div className="p-6 md:p-10 rounded-2xl border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
              <div className="mb-6">
                <span className="text-xs uppercase tracking-widest font-yanone text-accent">Preview: Individual Event Detail Page (`/events/{slug || '...'}`)</span>
              </div>

              {/* Event Banner */}
              <div className="relative h-60 sm:h-80 w-full rounded-lg overflow-hidden border mb-8" style={{ borderColor: 'var(--border)' }}>
                <img
                  src={imageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=80'}
                  alt={title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500 text-white">
                    {status}
                  </span>
                  {category && (
                    <span className="px-3 py-1 rounded text-xs font-yanone uppercase tracking-widest bg-white/20 text-white border border-white/20">
                      {category}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                  <h1 className="text-3xl md:text-5xl font-display font-medium text-text mb-6">
                    {title || 'Untitled Event'}
                  </h1>
                  <div className="prose dark:prose-invert max-w-none text-text-dim text-base">
                    <MarkdownRenderer content={description || '*No description provided yet.*'} />
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <div className="p-6 rounded-lg border bg-bg-surface space-y-4" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-lg font-display text-text border-b pb-3" style={{ borderColor: 'var(--rule)' }}>
                      Event Details
                    </h3>
                    <div className="text-sm space-y-3">
                      <div>
                        <p className="text-xs uppercase font-semibold text-text-muted">Date</p>
                        <p className="text-text font-medium mt-0.5">{formattedDate}</p>
                      </div>
                      {time && (
                        <div>
                          <p className="text-xs uppercase font-semibold text-text-muted">Time</p>
                          <p className="text-text font-medium mt-0.5">{time}</p>
                        </div>
                      )}
                      {location && (
                        <div>
                          <p className="text-xs uppercase font-semibold text-text-muted">Location</p>
                          <p className="text-text font-medium mt-0.5">{location}</p>
                        </div>
                      )}
                      {registrationUrl && (
                        <div className="pt-2">
                          <span className="inline-block w-full py-2 px-3 text-center rounded bg-accent text-white text-xs font-semibold uppercase tracking-wider">
                            Register / RSVP Link
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Event Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Card: Basic Details */}
            <div className="bg-prussian/20 backdrop-blur-sm rounded-xl p-6 border border-prussian/50 space-y-5">
              <h2 className="text-lg font-semibold text-white border-b border-prussian/50 pb-2">
                Event Overview
              </h2>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1.5">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. APOGEE Event / Physics Movie Screening / Group Discussion"
                  className="w-full px-4 py-2.5 rounded-lg bg-prussian/30 border border-prussian/50 text-white placeholder-gray-500 focus:outline-none focus:border-orange text-sm transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1.5">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-prussian/30 border border-prussian/50 text-white placeholder-gray-500 focus:outline-none focus:border-orange text-sm font-mono transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1.5">
                    Event Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-prussian/30 border border-prussian/50 text-white focus:outline-none focus:border-orange text-sm transition-colors"
                  >
                    <option value="Observation & Stargazing">Observation & Stargazing</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Talk & Lecture">Talk & Lecture</option>
                    <option value="Competition & Quiz">Competition & Quiz</option>
                    <option value="Social & Discussion">Social & Discussion</option>
                    <option value="Symposium">Symposium</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1.5">
                    Event Status *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-lg bg-prussian/30 border border-prussian/50 text-white focus:outline-none focus:border-orange text-sm transition-colors"
                  >
                    <option value="upcoming">Upcoming Event</option>
                    <option value="past">Conducted / Past</option>
                    <option value="ongoing">Ongoing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-prussian/30 border border-prussian/50 text-white focus:outline-none focus:border-orange text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1.5">
                    Time Display
                  </label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. 7:00 PM – 10:30 PM"
                    className="w-full px-4 py-2.5 rounded-lg bg-prussian/30 border border-prussian/50 text-white placeholder-gray-500 focus:outline-none focus:border-orange text-sm transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1.5">
                  Location / Venue (&quot;Where&quot;) *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. SAC Rooftop & Sky Observatory, BITS Pilani"
                  className="w-full px-4 py-2.5 rounded-lg bg-prussian/30 border border-prussian/50 text-white placeholder-gray-500 focus:outline-none focus:border-orange text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1.5">
                  Registration / RSVP Link (Optional)
                </label>
                <input
                  type="url"
                  value={registrationUrl}
                  onChange={(e) => setRegistrationUrl(e.target.value)}
                  placeholder="e.g. Google Form link, Unstop link, or RSVP page"
                  className="w-full px-4 py-2.5 rounded-lg bg-prussian/30 border border-prussian/50 text-white placeholder-gray-500 focus:outline-none focus:border-orange text-sm transition-colors"
                />
              </div>
            </div>

            {/* Card: Cover Image */}
            <div className="bg-prussian/20 backdrop-blur-sm rounded-xl p-6 border border-prussian/50 space-y-4">
              <h2 className="text-lg font-semibold text-white border-b border-prussian/50 pb-2">
                Event Poster / Image
              </h2>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1.5">
                  Poster Image URL
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... or upload an image below"
                    className="flex-1 px-4 py-2.5 rounded-lg bg-prussian/30 border border-prussian/50 text-white placeholder-gray-500 focus:outline-none focus:border-orange text-sm transition-colors"
                  />
                  <ImageUploader
                    label="Upload Poster"
                    onUploaded={(url) => {
                      setImageUrl(url);
                      toast.success('Poster uploaded!');
                    }}
                  />
                </div>
              </div>

              {imageUrl && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-2">Image Preview:</p>
                  <div className="relative h-44 w-full max-w-md rounded-lg overflow-hidden border border-prussian/60">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
            </div>

            {/* Card: Description */}
            <div className="bg-prussian/20 backdrop-blur-sm rounded-xl p-6 border border-prussian/50 space-y-4">
              <div className="flex items-center justify-between border-b border-prussian/50 pb-2">
                <h2 className="text-lg font-semibold text-white">
                  Event Description (&quot;What&quot;)
                </h2>
                <span className="text-xs text-gray-400">Markdown supported</span>
              </div>

              <textarea
                rows={8}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write all details about what will happen (or what happened) in this event: topics, schedule, requirements, speakers..."
                className="w-full px-4 py-3 rounded-lg bg-prussian/30 border border-prussian/50 text-white placeholder-gray-500 focus:outline-none focus:border-orange text-sm font-sans transition-colors resize-y leading-relaxed"
              />
            </div>

            {/* Card: Publishing options */}
            <div className="bg-prussian/20 backdrop-blur-sm rounded-xl p-6 border border-prussian/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-5 h-5 rounded border-prussian/50 text-orange focus:ring-orange accent-orange"
                />
                <div>
                  <p className="text-sm font-semibold text-white">Published</p>
                  <p className="text-xs text-gray-400">
                    If unchecked, this event will be saved as a draft with a private preview available.
                  </p>
                </div>
              </label>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="px-4 py-2.5 rounded-lg border border-prussian/60 text-amber-300 hover:text-white text-sm font-medium transition-colors"
                >
                  👁️ Preview Draft
                </button>
                <Link
                  href="/admin/events"
                  className="px-5 py-2.5 rounded-lg border border-prussian/60 text-gray-300 hover:text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-orange hover:bg-orange/80 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-lg transition-colors text-sm flex items-center gap-2 shadow-md"
                >
                  {saving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}

export default function EditEventPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-prussian border-t-orange rounded-full animate-spin" />
        </div>
      }
    >
      <EditEventForm />
    </Suspense>
  );
}
