'use client';

import React, { useState, useEffect } from 'react';
import { EventItem } from '@/lib/types';
import { fetchAllEvents } from '@/lib/eventsStorage';
import EventCard from '@/components/EventCard';
import XkcdStrip from '@/components/XkcdStrip';
import { XKCD_COMICS } from '@/constants/xkcd';
import { FaSearch, FaCalendarCheck, FaFilter } from 'react-icons/fa';

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'upcoming' | 'past'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    try {
      const data = await fetchAllEvents(true);
      setEvents(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  // Derive categories from current events
  const categories = Array.from(
    new Set(events.map((e) => e.category).filter(Boolean))
  );

  // Filter events by tab, category, search
  const filteredEvents = events.filter((event) => {
    // 1. Tab filter
    if (tab === 'upcoming' && event.status !== 'upcoming') return false;
    if (tab === 'past' && event.status !== 'past') return false;

    // 2. Category filter
    if (selectedCategory !== 'all' && event.category !== selectedCategory) {
      return false;
    }

    // 3. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = event.title?.toLowerCase().includes(q);
      const matchDesc = event.description?.toLowerCase().includes(q);
      const matchLoc = event.location?.toLowerCase().includes(q);
      const matchCat = event.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc && !matchCat) return false;
    }

    return true;
  });

  const upcomingCount = events.filter((e) => e.status === 'upcoming').length;
  const pastCount = events.filter((e) => e.status === 'past').length;

  return (
    <main className="min-h-screen bg-transparent">
      {/* ── Hero Section ── */}
      <section className="pt-16 pb-20 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-[1400px] mx-auto px-5 md:px-8">
          <div className="mb-4">
            <span className="text-xl uppercase tracking-[0.2em] font-yanone text-accent">
              Association Activities
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <h1 className="text-[3.5rem] md:text-[6rem] text-text leading-[1.05] tracking-tight font-display">
                Club{' '}
                <span className="font-lobster text-accent lowercase text-[4.5rem] md:text-[7.5rem] inline-block transform -rotate-2">
                  Events
                </span>
                <span className="font-marker text-accent2 text-2xl md:text-4xl absolute mt-4 md:mt-8 ml-2 rotate-12 inline-block">
                  !
                </span>
              </h1>
              <p className="text-lg md:text-xl text-text-dim leading-relaxed mt-6 max-w-2xl">
                Discover what we have conducted and what’s coming up next — from engaging
                group discussions and movie screenings to flagship APOGEE events, talks,
                and meetups.
              </p>
            </div>

            <div className="lg:max-w-md w-full shrink-0">
              <XkcdStrip comic={XKCD_COMICS.nerdSniping} maxWidth="max-w-md" className="!py-0 !px-0" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Filter & Navigation Bar ── */}
      <section className="py-8 border-b" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="max-w-[1400px] mx-auto px-5 md:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Primary Status Tabs */}
            <div className="flex items-center gap-2 border p-1 rounded-md bg-bg" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => setTab('all')}
                className={`px-4 py-2 text-sm font-semibold rounded transition-all ${
                  tab === 'all'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-dim hover:text-text'
                }`}
              >
                All ({events.length})
              </button>

              <button
                onClick={() => setTab('upcoming')}
                className={`px-4 py-2 text-sm font-semibold rounded flex items-center gap-2 transition-all ${
                  tab === 'upcoming'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-text-dim hover:text-text'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Upcoming ({upcomingCount})
              </button>

              <button
                onClick={() => setTab('past')}
                className={`px-4 py-2 text-sm font-semibold rounded transition-all ${
                  tab === 'past'
                    ? 'bg-zinc-700 text-white shadow-sm'
                    : 'text-text-dim hover:text-text'
                }`}
              >
                Conducted ({pastCount})
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by title, venue, topic..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded border outline-none bg-bg text-text transition-colors focus:border-accent"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t" style={{ borderColor: 'var(--rule)' }}>
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted mr-1 flex items-center gap-1.5">
                <FaFilter className="text-[10px]" /> Category:
              </span>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-accent text-white border-accent'
                    : 'border-border text-text-dim hover:text-text'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat ? 'all' : cat)
                  }
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selectedCategory === cat
                      ? 'bg-accent text-white border-accent'
                      : 'border-border text-text-dim hover:text-text'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Events Grid ── */}
      <section className="py-16 md:py-24" style={{ background: 'var(--bg-raised)' }}>
        <div className="max-w-[1400px] mx-auto px-5 md:px-8">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-96 rounded border bg-bg-surface animate-pulse"
                  style={{ borderColor: 'var(--border)' }}
                />
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div
              className="text-center py-20 border bg-bg-surface rounded-md p-8"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center text-accent text-2xl">
                <FaCalendarCheck />
              </div>
              <h3 className="text-3xl font-display text-text mb-2">No events found</h3>
              <p className="text-text-dim max-w-md mx-auto mb-6">
                {searchQuery || selectedCategory !== 'all' || tab !== 'all'
                  ? 'No events match your current filter or search criteria. Try resetting filters.'
                  : 'We are planning exciting events right now. Stay tuned for announcements!'}
              </p>
              {(searchQuery || selectedCategory !== 'all' || tab !== 'all') && (
                <button
                  onClick={() => {
                    setTab('all');
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="px-5 py-2 rounded text-sm font-semibold bg-accent text-white hover:opacity-90 transition-opacity"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
