'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EventItem } from '@/lib/types';
import { fetchEventBySlug } from '@/lib/eventsStorage';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import toast from 'react-hot-toast';
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaArrowLeft,
  FaExternalLinkAlt,
  FaShareAlt,
  FaCalendarPlus,
} from 'react-icons/fa';

export default function EventDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const isPreview = searchParams?.get('preview') === 'true';

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadEvent();
    }
  }, [slug, isPreview]);

  async function loadEvent() {
    setLoading(true);
    try {
      const data = await fetchEventBySlug(slug, isPreview);
      setEvent(data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: event?.title || 'Physics Association Event',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  }

  // Create Google Calendar link
  function getGoogleCalendarUrl(ev: EventItem) {
    try {
      const d = new Date(ev.date);
      const isoStart = d.toISOString().replace(/-|:|\.\d\d\d/g, '');
      const endDate = new Date(d.getTime() + 2 * 60 * 60 * 1000);
      const isoEnd = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '');

      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: ev.title,
        dates: `${isoStart}/${isoEnd}`,
        details: `${ev.description}\n\nVenue: ${ev.location}`,
        location: ev.location,
      });
      return `https://calendar.google.com/calendar/render?${params.toString()}`;
    } catch {
      return '#';
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-prussian border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl font-display text-text mb-4">Event Not Found</h1>
        <p className="text-text-dim mb-8 max-w-md">
          The event you are looking for does not exist or may have been moved.
        </p>
        <Link
          href="/events"
          className="px-6 py-2.5 rounded bg-accent text-white font-semibold transition-opacity hover:opacity-90 inline-flex items-center gap-2"
        >
          <FaArrowLeft /> Back to Events
        </Link>
      </main>
    );
  }

  const isUpcoming = event.status === 'upcoming';
  const isPast = event.status === 'past';

  let formattedDate = event.date;
  try {
    const d = new Date(event.date);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  } catch {}

  const defaultImage =
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=80';

  return (
    <main className="min-h-screen pb-24">
      {(!event.published || isPreview) && (
        <div className="bg-amber-500 text-black px-4 py-2.5 text-center text-xs md:text-sm font-semibold tracking-wide sticky top-0 z-50 flex flex-wrap items-center justify-center gap-3 shadow-md">
          <span>👁️ DRAFT PREVIEW MODE — This is how your event will look once published. It is currently unpublished.</span>
          <Link href="/admin/events" className="underline font-bold hover:text-white transition-colors">
            Back to Events Manager
          </Link>
        </div>
      )}

      {/* ── Top Navigation & Breadcrumb ── */}
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 py-5 flex items-center justify-between">
          <Link
            href="/events"
            className="text-sm font-semibold uppercase tracking-wider text-text-dim hover:text-accent transition-colors inline-flex items-center gap-2"
          >
            <FaArrowLeft /> All Events
          </Link>

          <button
            onClick={handleShare}
            className="text-sm font-semibold uppercase tracking-wider text-text-dim hover:text-accent transition-colors inline-flex items-center gap-2"
          >
            <FaShareAlt /> Share
          </button>
        </div>
      </div>

      {/* ── Event Hero Banner ── */}
      <section className="relative w-full max-w-[1200px] mx-auto px-5 md:px-8 pt-8">
        <div className="relative h-64 sm:h-96 md:h-[450px] w-full rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          <img
            src={event.image_url || defaultImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Badges on top banner */}
          <div className="absolute top-6 left-6 flex items-center gap-3">
            {isUpcoming ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-emerald-500/90 text-white backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                Upcoming Event
              </span>
            ) : isPast ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-black/60 text-gray-200 backdrop-blur-md border border-white/20">
                Conducted Event
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-amber-500/90 text-white backdrop-blur-md">
                Ongoing
              </span>
            )}

            {event.category && (
              <span className="text-xs font-yanone uppercase tracking-widest px-3 py-1 bg-white/20 text-white backdrop-blur-md rounded border border-white/20">
                {event.category}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Event Info & Body ── */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Info Column (Left 8 cols) */}
          <div className="lg:col-span-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium text-text leading-tight mb-8">
              {event.title}
            </h1>

            {/* Markdown content */}
            <div className="prose dark:prose-invert max-w-none text-text-dim leading-relaxed text-base md:text-lg">
              <MarkdownRenderer content={event.description} />
            </div>
          </div>

          {/* Details Sidebar (Right 4 cols) */}
          <aside className="lg:col-span-4">
            <div
              className="sticky top-28 p-6 md:p-8 rounded-lg border bg-bg-surface space-y-6"
              style={{ borderColor: 'var(--border)' }}
            >
              <h3 className="text-xl font-display text-text border-b pb-4" style={{ borderColor: 'var(--rule)' }}>
                Event Details
              </h3>

              {/* Date */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
                  <FaCalendarAlt />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-text-muted font-semibold">Date</p>
                  <p className="text-text font-medium text-sm md:text-base mt-0.5">{formattedDate}</p>
                </div>
              </div>

              {/* Time */}
              {event.time && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <FaClock />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-text-muted font-semibold">Time</p>
                    <p className="text-text font-medium text-sm md:text-base mt-0.5">{event.time}</p>
                  </div>
                </div>
              )}

              {/* Location */}
              {event.location && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded bg-accent2/10 text-accent2 flex items-center justify-center shrink-0 mt-0.5">
                    <FaMapMarkerAlt />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-text-muted font-semibold">Venue / Where</p>
                    <p className="text-text font-medium text-sm md:text-base mt-0.5">{event.location}</p>
                  </div>
                </div>
              )}

              {/* Call to actions */}
              <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--rule)' }}>
                {isUpcoming && event.registration_url && (
                  <a
                    href={event.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded font-semibold text-sm uppercase tracking-wider bg-accent hover:opacity-90 text-white transition-opacity flex items-center justify-center gap-2 shadow-sm"
                  >
                    Register / RSVP <FaExternalLinkAlt className="text-xs" />
                  </a>
                )}

                {isUpcoming && (
                  <a
                    href={getGoogleCalendarUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded font-semibold text-xs uppercase tracking-wider border border-border text-text hover:bg-bg transition-colors flex items-center justify-center gap-2"
                  >
                    <FaCalendarPlus className="text-accent" /> Add to Google Calendar
                  </a>
                )}
              </div>
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}
