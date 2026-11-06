'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { EventItem } from '@/lib/types';
import {
  fetchAllEvents,
  deleteEventById,
  updateEventById,
  checkAdminSession,
} from '@/lib/eventsStorage';
import toast from 'react-hot-toast';

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'draft'>('all');
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const isAuth = await checkAdminSession();
    if (!isAuth) {
      router.push('/admin');
      return;
    }
    if (typeof window !== 'undefined' && localStorage.getItem('demo_admin_auth') === 'true') {
      setIsDemoMode(true);
    }
    setAuthenticated(true);
    loadEvents();
  }

  async function loadEvents() {
    setLoading(true);
    try {
      const data = await fetchAllEvents(false);
      setEvents(data);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    setDeleting(id);
    const { error } = await deleteEventById(id);

    if (error) {
      toast.error('Failed to delete event: ' + error.message);
      setDeleting(null);
      return;
    }

    toast.success('Event deleted');
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setDeleting(null);
  }

  async function togglePublished(event: EventItem) {
    const newStatus = !event.published;
    const { error } = await updateEventById(event.id, { published: newStatus });

    if (error) {
      toast.error('Failed to update event: ' + error.message);
      return;
    }

    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, published: newStatus } : e))
    );
    toast.success(newStatus ? 'Event published' : 'Event unpublished');
  }

  async function handleLogout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('demo_admin_auth');
    }
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    router.push('/admin');
  }

  const filteredEvents = events.filter((e) => {
    if (filter === 'upcoming') return e.status === 'upcoming';
    if (filter === 'past') return e.status === 'past';
    if (filter === 'draft') return !e.published;
    return true;
  });

  const totalUpcoming = events.filter((e) => e.status === 'upcoming').length;
  const totalPast = events.filter((e) => e.status === 'past').length;
  const totalDrafts = events.filter((e) => !e.published).length;

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-prussian border-t-orange rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <Link
              href="/admin"
              className="text-gray-400 hover:text-orange transition-colors text-sm mb-2 inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Articles Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white mb-1">Events Manager</h1>
              {isDemoMode && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Test / Demo Mode
                </span>
              )}
            </div>
            <p className="text-gray-400">Add, edit, or delete upcoming and conducted events</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/events/create"
              className="bg-orange hover:bg-orange/80 text-white font-bold py-2 px-5 rounded-lg transition-colors flex items-center gap-2 text-sm shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Event
            </Link>
            <button
              onClick={handleLogout}
              className="bg-prussian/40 hover:bg-prussian/60 text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors border border-prussian/50 text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Category Tabs */}
        <div className="flex items-center gap-2 border-b border-prussian/50 pb-4 mb-8 overflow-x-auto">
          <Link
            href="/admin?tab=articles"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap bg-prussian/30 text-gray-400 hover:text-white border border-prussian/50"
          >
            <span>📝</span> Articles
          </Link>
          <Link
            href="/admin?tab=newsletters"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap bg-prussian/30 text-gray-400 hover:text-white border border-prussian/50"
          >
            <span>📰</span> Newsletters
          </Link>
          <Link
            href="/admin?tab=events"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap bg-orange text-white shadow-md"
          >
            <span>📅</span> Events ({events.length})
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-prussian/20 backdrop-blur-sm rounded-xl p-5 border border-prussian/50">
            <p className="text-gray-400 text-sm mb-1">Total Events</p>
            <p className="text-3xl font-bold text-white">{events.length}</p>
          </div>
          <div className="bg-prussian/20 backdrop-blur-sm rounded-xl p-5 border border-prussian/50">
            <p className="text-gray-400 text-sm mb-1">Upcoming</p>
            <p className="text-3xl font-bold text-emerald-400">{totalUpcoming}</p>
          </div>
          <div className="bg-prussian/20 backdrop-blur-sm rounded-xl p-5 border border-prussian/50">
            <p className="text-gray-400 text-sm mb-1">Conducted</p>
            <p className="text-3xl font-bold text-sky-400">{totalPast}</p>
          </div>
          <div className="bg-prussian/20 backdrop-blur-sm rounded-xl p-5 border border-prussian/50">
            <p className="text-gray-400 text-sm mb-1">Drafts</p>
            <p className="text-3xl font-bold text-amber-400">{totalDrafts}</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-orange text-white'
                : 'bg-prussian/40 text-gray-400 hover:text-white border border-prussian/50'
            }`}
          >
            All ({events.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'upcoming'
                ? 'bg-emerald-600 text-white'
                : 'bg-prussian/40 text-gray-400 hover:text-white border border-prussian/50'
            }`}
          >
            Upcoming ({totalUpcoming})
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'past'
                ? 'bg-sky-700 text-white'
                : 'bg-prussian/40 text-gray-400 hover:text-white border border-prussian/50'
            }`}
          >
            Conducted ({totalPast})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'draft'
                ? 'bg-amber-600 text-white'
                : 'bg-prussian/40 text-gray-400 hover:text-white border border-prussian/50'
            }`}
          >
            Drafts ({totalDrafts})
          </button>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-prussian/20 rounded-xl animate-pulse h-24 border border-prussian/30" />
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="space-y-3">
            {filteredEvents.map((event) => {
              let displayDate = event.date;
              try {
                const d = new Date(event.date);
                if (!isNaN(d.getTime())) {
                  displayDate = d.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                }
              } catch {}

              return (
                <div
                  key={event.id}
                  className="bg-prussian/20 backdrop-blur-sm rounded-xl p-5 border border-prussian/50 hover:border-prussian transition-colors"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    
                    {/* Left: Details */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-16 h-16 rounded-lg object-cover shrink-0 border border-white/10"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-prussian/60 border border-prussian/80 flex items-center justify-center text-gray-500 shrink-0 text-xl">
                          🌌
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-white truncate">
                            {event.title}
                          </h3>

                          {/* Status Badge */}
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              event.status === 'upcoming'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : event.status === 'past'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {event.status}
                          </span>

                          {/* Published Badge */}
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              event.published
                                ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                            }`}
                          >
                            {event.published ? 'Published' : 'Draft'}
                          </span>

                          {event.category && (
                            <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10">
                              {event.category}
                            </span>
                          )}
                        </div>

                        <p className="text-gray-400 text-sm flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>📅 {displayDate} {event.time && `• ${event.time}`}</span>
                          {event.location && <span>📍 {event.location}</span>}
                        </p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {event.published ? (
                        <Link
                          href={`/events/${event.slug}`}
                          target="_blank"
                          className="p-2 text-gray-400 hover:text-white hover:bg-prussian/50 rounded-lg transition-colors"
                          title="View on site"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      ) : (
                        <Link
                          href={`/events/${event.slug}?preview=true`}
                          target="_blank"
                          className="px-2.5 py-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1.5"
                          title="Preview how draft event looks"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>Preview Draft</span>
                        </Link>
                      )}

                      <button
                        onClick={() => togglePublished(event)}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-orange hover:bg-prussian/50 rounded-lg transition-colors"
                      >
                        {event.published ? 'Unpublish' : 'Publish'}
                      </button>

                      <Link
                        href={`/admin/events/edit/${event.id}`}
                        className="p-2 text-gray-400 hover:text-orange hover:bg-prussian/50 rounded-lg transition-colors"
                        title="Edit event"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>

                      <button
                        onClick={() => handleDelete(event.id, event.title)}
                        disabled={deleting === event.id}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete event"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-prussian/10 rounded-2xl border border-prussian/30">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-prussian/40 flex items-center justify-center text-3xl">
              🔭
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No events found</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              {filter !== 'all'
                ? `No events currently match the "${filter}" filter.`
                : 'Start adding your conducted and upcoming association events!'}
            </p>
            <Link
              href="/admin/events/create"
              className="inline-block bg-orange hover:bg-orange/80 text-white font-bold py-2.5 px-6 rounded-lg transition-colors"
            >
              Add New Event
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
