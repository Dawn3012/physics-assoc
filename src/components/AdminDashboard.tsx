'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Article, Newsletter, EventItem } from '@/lib/types';
import { formatBytes } from '@/lib/format';
import {
  fetchAllEvents,
  deleteEventById,
  updateEventById,
  checkAdminSession,
} from '@/lib/eventsStorage';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import EventCard from '@/components/EventCard';
import toast from 'react-hot-toast';

/* ── Demo Mode Seed Data ── */
const DEMO_SEED_ARTICLES: Article[] = [
  {
    id: 'demo-art-1',
    title: 'Quantum Computing and Superposition: What Lies Ahead',
    slug: 'quantum-computing-superposition',
    excerpt: 'Exploring the physical foundations and future of qubits in modern quantum processors.',
    content: `# Quantum Computing and Superposition

Quantum computing represents a fundamental shift in how we process information. Rather than storing information in classical bits that exist strictly as 0 or 1, a quantum bit or **qubit** can exist in a superposition of both states.

## The Principle of Superposition

In mathematical terms, the state of a single qubit can be described as:

$$\\psi = \\alpha |0\\rangle + \\beta |1\\rangle$$

where $\\alpha$ and $\\beta$ are probability amplitudes satisfying $|\\alpha|^2 + |\\beta|^2 = 1$.

## Practical Applications
- Cryptography & Shor's Algorithm
- Quantum Chemistry & Molecular Simulation
- Complex Many-Body Physics Optimization`,
    cover_image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&q=80',
    published: true,
    author: 'Physics Association',
    tags: ['Quantum', 'Computing', 'Physics'],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'demo-art-2',
    title: 'DRAFT: Gravitational Waves & Black Hole Mergers',
    slug: 'gravitational-waves-black-holes',
    excerpt: 'A deep dive into recent LIGO and Virgo strain signals and astrophysical insights.',
    content: `# Gravitational Waves: Strain in Spacetime

Gravitational waves are ripples in the fabric of spacetime caused by some of the most violent and energetic processes in the Universe.

> **Draft Notice**: This article is currently in draft preview mode. Check all references and figures before publishing.

## Einstein's General Relativity
First predicted in 1916 by Albert Einstein on the basis of his theory of general relativity, gravitational waves transport energy as gravitational radiation.`,
    cover_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80',
    published: false,
    author: 'Research Wing',
    tags: ['Cosmology', 'Astrophysics', 'LIGO'],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

const DEMO_SEED_NEWSLETTERS: Newsletter[] = [
  {
    id: 'demo-news-1',
    title: 'The Quantum Chronicle — Issue 12',
    slug: 'quantum-chronicle-issue-12',
    description: 'Fall semester issue featuring department research highlights and student achievements.',
    issue: 'Issue 12',
    file_path: 'newsletters/issue-12.pdf',
    file_url: '#',
    file_size_bytes: 2450000,
    original_size_bytes: 2450000,
    published: true,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: 'demo-news-2',
    title: 'DRAFT: The Quantum Chronicle — APOGEE Special',
    slug: 'quantum-chronicle-apogee-special',
    description: 'Special festival issue covering physics conclaves, guest talks, and competitions.',
    issue: 'Issue 13 (APOGEE)',
    file_path: 'newsletters/issue-13.pdf',
    file_url: '#',
    file_size_bytes: 3100000,
    original_size_bytes: 3100000,
    published: false,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const DEMO_SEED_EVENTS: EventItem[] = [
  {
    id: 'demo-ev-1',
    title: 'APOGEE 2026: Physics Conclave & Flagship Quiz',
    slug: 'apogee-2026-physics-conclave',
    description: 'Join us for the annual APOGEE flagship physics event featuring challenging problem sets, discussions, and quiz rounds across mechanics, electromagnetism, and modern physics.',
    date: '2026-11-25',
    time: '17:00 - 20:00',
    location: 'NAB Auditorium, BITS Pilani',
    category: 'APOGEE',
    image_url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&q=80',
    published: true,
    status: 'upcoming',
    registration_url: 'https://bits-apogee.org',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'demo-ev-2',
    title: 'DRAFT: Physics Movie Night & Group Discussion: Oppenheimer',
    slug: 'physics-movie-night-oppenheimer',
    description: 'Full screening followed by an open moderated group discussion on the history, ethics, and physics of the Manhattan Project.',
    date: '2026-12-05',
    time: '18:30 - 21:30',
    location: 'Room 2104, Physics Department',
    category: 'Social & Discussion',
    image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80',
    published: false,
    status: 'upcoming',
    registration_url: '',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export function AdminDashboardContent({ isDemoMode = false }: { isDemoMode?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = isDemoMode || searchParams?.get('demo') === 'true';

  const initialTab = (searchParams?.get('tab') as 'articles' | 'newsletters' | 'events') || 'articles';

  const [activeTab, setActiveTab] = useState<'articles' | 'newsletters' | 'events'>(initialTab);
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(true);

  // Login form states (for inline login right on /admin)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Data states
  const [articles, setArticles] = useState<Article[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  // Sub-filter for each tab
  const [articleFilter, setArticleFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [newsletterFilter, setNewsletterFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [eventFilter, setEventFilter] = useState<'all' | 'upcoming' | 'past' | 'draft'>('all');

  // Action states
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // In-admin Draft Preview modal state
  const [previewItem, setPreviewItem] = useState<{
    type: 'article' | 'newsletter' | 'event';
    data: any;
  } | null>(null);

  useEffect(() => {
    checkAuth();
  }, [isDemo]);

  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam === 'articles' || tabParam === 'newsletters' || tabParam === 'events') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  async function checkAuth() {
    setAuthChecking(true);
    if (isDemo) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('demo_admin_auth', 'true');
      }
      setAuthenticated(true);
      setAuthChecking(false);
      fetchDemoData();
      return;
    }

    // In real admin mode, check Supabase session
    const isAuth = await checkAdminSession(false);
    if (!isAuth) {
      setAuthenticated(false);
      setAuthChecking(false);
      setLoading(false);
      return;
    }
    setAuthenticated(true);
    setAuthChecking(false);
    fetchAllData();
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    if (!supabase) {
      setLoginError(
        'Supabase is not configured in this environment. (You can visit /demo for local demo mode)'
      );
      setLoginLoading(false);
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setLoginError(authError.message);
        setLoginLoading(false);
        return;
      }

      toast.success('Signed in successfully');
      setAuthenticated(true);
      setLoginLoading(false);
      fetchAllData();
    } catch (err: any) {
      setLoginError(err?.message || 'Login failed');
      setLoginLoading(false);
    }
  }

  function fetchDemoData() {
    setLoading(true);
    try {
      if (typeof window !== 'undefined') {
        // Articles
        const rawArt = localStorage.getItem('pa_demo_articles');
        if (rawArt) {
          setArticles(JSON.parse(rawArt));
        } else {
          setArticles(DEMO_SEED_ARTICLES);
          localStorage.setItem('pa_demo_articles', JSON.stringify(DEMO_SEED_ARTICLES));
        }

        // Newsletters
        const rawNews = localStorage.getItem('pa_demo_newsletters');
        if (rawNews) {
          setNewsletters(JSON.parse(rawNews));
        } else {
          setNewsletters(DEMO_SEED_NEWSLETTERS);
          localStorage.setItem('pa_demo_newsletters', JSON.stringify(DEMO_SEED_NEWSLETTERS));
        }

        // Events
        const rawEv = localStorage.getItem('pa_custom_events');
        if (rawEv && JSON.parse(rawEv).length > 0) {
          setEvents(JSON.parse(rawEv));
        } else {
          setEvents(DEMO_SEED_EVENTS);
          localStorage.setItem('pa_custom_events', JSON.stringify(DEMO_SEED_EVENTS));
        }
      }
    } catch (e) {
      setArticles(DEMO_SEED_ARTICLES);
      setNewsletters(DEMO_SEED_NEWSLETTERS);
      setEvents(DEMO_SEED_EVENTS);
    } finally {
      setLoading(false);
    }
  }

  function resetDemoData() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pa_demo_articles', JSON.stringify(DEMO_SEED_ARTICLES));
      localStorage.setItem('pa_demo_newsletters', JSON.stringify(DEMO_SEED_NEWSLETTERS));
      localStorage.setItem('pa_custom_events', JSON.stringify(DEMO_SEED_EVENTS));
      setArticles(DEMO_SEED_ARTICLES);
      setNewsletters(DEMO_SEED_NEWSLETTERS);
      setEvents(DEMO_SEED_EVENTS);
      toast.success('Demo data reset to default seed!');
    }
  }

  async function fetchAllData() {
    setLoading(true);

    if (supabase) {
      // 1. Articles
      try {
        const { data: artData } = await supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: false });
        if (artData) setArticles(artData);
      } catch (err) {
        console.error('Error fetching articles:', err);
      }

      // 2. Newsletters
      try {
        const { data: newsData } = await supabase
          .from('newsletters')
          .select('*')
          .order('created_at', { ascending: false });
        if (newsData) setNewsletters(newsData);
      } catch (err) {
        console.error('Error fetching newsletters:', err);
      }

      // 3. Events
      try {
        const { data: evData, error: evError } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: false });
        if (!evError && evData) {
          setEvents(evData);
        } else {
          const localEvents = await fetchAllEvents(false);
          setEvents(localEvents);
        }
      } catch {
        const localEvents = await fetchAllEvents(false);
        setEvents(localEvents);
      }

      setLoading(false);
      return;
    }

    // Fallback if supabase not configured
    const localEvents = await fetchAllEvents(false);
    setEvents(localEvents);
    setLoading(false);
  }

  /* ── Article Handlers ── */
  async function toggleArticlePublished(article: Article) {
    if (isDemo) {
      const updated = articles.map((a) =>
        a.id === article.id ? { ...a, published: !a.published } : a
      );
      setArticles(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('pa_demo_articles', JSON.stringify(updated));
      }
      toast.success(article.published ? 'Demo: Article unpublished' : 'Demo: Article published');
      if (previewItem && previewItem.type === 'article' && previewItem.data.id === article.id) {
        setPreviewItem(null);
      }
      return;
    }

    if (!supabase) return;
    const { error } = await supabase
      .from('articles')
      .update({ published: !article.published })
      .eq('id', article.id);

    if (error) {
      toast.error('Failed to update article');
      return;
    }

    setArticles((prev) =>
      prev.map((a) => (a.id === article.id ? { ...a, published: !a.published } : a))
    );
    toast.success(article.published ? 'Article unpublished' : 'Article published');
    if (previewItem && previewItem.type === 'article' && previewItem.data.id === article.id) {
      setPreviewItem(null);
    }
  }

  async function deleteArticle(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    setDeletingId(id);

    if (isDemo) {
      const updated = articles.filter((a) => a.id !== id);
      setArticles(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('pa_demo_articles', JSON.stringify(updated));
      }
      toast.success('Demo: Article deleted');
      setDeletingId(null);
      return;
    }

    if (supabase) {
      const { error } = await supabase.from('articles').delete().eq('id', id);
      if (error) {
        toast.error('Failed to delete article');
        setDeletingId(null);
        return;
      }
    }
    toast.success('Article deleted');
    setArticles((prev) => prev.filter((a) => a.id !== id));
    setDeletingId(null);
  }

  /* ── Newsletter Handlers ── */
  async function toggleNewsletterPublished(newsletter: Newsletter) {
    if (isDemo) {
      const updated = newsletters.map((n) =>
        n.id === newsletter.id ? { ...n, published: !n.published } : n
      );
      setNewsletters(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('pa_demo_newsletters', JSON.stringify(updated));
      }
      toast.success(newsletter.published ? 'Demo: Newsletter unpublished' : 'Demo: Newsletter published');
      if (previewItem && previewItem.type === 'newsletter' && previewItem.data.id === newsletter.id) {
        setPreviewItem(null);
      }
      return;
    }

    if (!supabase) return;
    const { error } = await supabase
      .from('newsletters')
      .update({ published: !newsletter.published })
      .eq('id', newsletter.id);

    if (error) {
      toast.error('Failed to update newsletter');
      return;
    }

    setNewsletters((prev) =>
      prev.map((n) => (n.id === newsletter.id ? { ...n, published: !n.published } : n))
    );
    toast.success(newsletter.published ? 'Newsletter unpublished' : 'Newsletter published');
    if (previewItem && previewItem.type === 'newsletter' && previewItem.data.id === newsletter.id) {
      setPreviewItem(null);
    }
  }

  async function deleteNewsletter(newsletter: Newsletter) {
    if (!confirm(`Are you sure you want to delete "${newsletter.title}"?`)) return;
    setDeletingId(newsletter.id);

    if (isDemo) {
      const updated = newsletters.filter((n) => n.id !== newsletter.id);
      setNewsletters(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('pa_demo_newsletters', JSON.stringify(updated));
      }
      toast.success('Demo: Newsletter deleted');
      setDeletingId(null);
      return;
    }

    if (supabase) {
      if (newsletter.file_path) {
        await supabase.storage.from('newsletters').remove([newsletter.file_path]);
      }
      const { error } = await supabase.from('newsletters').delete().eq('id', newsletter.id);
      if (error) {
        toast.error('Failed to delete newsletter');
        setDeletingId(null);
        return;
      }
    }
    toast.success('Newsletter deleted');
    setNewsletters((prev) => prev.filter((n) => n.id !== newsletter.id));
    setDeletingId(null);
  }

  /* ── Event Handlers ── */
  async function toggleEventPublished(event: EventItem) {
    const newStatus = !event.published;
    if (isDemo) {
      const updated = events.map((e) =>
        e.id === event.id ? { ...e, published: newStatus } : e
      );
      setEvents(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('pa_custom_events', JSON.stringify(updated));
      }
      toast.success(newStatus ? 'Demo: Event published' : 'Demo: Event unpublished');
      if (previewItem && previewItem.type === 'event' && previewItem.data.id === event.id) {
        setPreviewItem(null);
      }
      return;
    }

    const { error } = await updateEventById(event.id, { published: newStatus });
    if (error) {
      toast.error('Failed to update event: ' + error.message);
      return;
    }
    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, published: newStatus } : e))
    );
    toast.success(newStatus ? 'Event published' : 'Event unpublished');
    if (previewItem && previewItem.type === 'event' && previewItem.data.id === event.id) {
      setPreviewItem(null);
    }
  }

  async function deleteEvent(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    setDeletingId(id);

    if (isDemo) {
      const updated = events.filter((e) => e.id !== id);
      setEvents(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('pa_custom_events', JSON.stringify(updated));
      }
      toast.success('Demo: Event deleted');
      setDeletingId(null);
      return;
    }

    const { error } = await deleteEventById(id);
    if (error) {
      toast.error('Failed to delete event: ' + error.message);
      setDeletingId(null);
      return;
    }
    toast.success('Event deleted');
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setDeletingId(null);
  }

  async function handleLogout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('demo_admin_auth');
    }
    if (isDemo) {
      toast.success('Exited demo mode');
      setAuthenticated(false);
      router.push('/admin');
      return;
    }
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    setAuthenticated(false);
    toast.success('Signed out');
  }

  // Filtered lists
  const filteredArticles = articles.filter((a) => {
    if (articleFilter === 'published') return a.published;
    if (articleFilter === 'draft') return !a.published;
    return true;
  });

  const filteredNewsletters = newsletters.filter((n) => {
    if (newsletterFilter === 'published') return n.published;
    if (newsletterFilter === 'draft') return !n.published;
    return true;
  });

  const filteredEvents = events.filter((e) => {
    if (eventFilter === 'upcoming') return e.status === 'upcoming';
    if (eventFilter === 'past') return e.status === 'past';
    if (eventFilter === 'draft') return !e.published;
    return true;
  });

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-prussian border-t-orange rounded-full animate-spin" />
      </div>
    );
  }

  // Render original clean login page right on /admin when unauthenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange/20">
              <svg className="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
            <p className="text-gray-400 text-sm">Sign in to manage articles, newsletters, and events</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="bg-prussian/20 backdrop-blur-sm rounded-2xl p-8 border border-prussian/50">
            {loginError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm leading-relaxed">
                {loginError}
              </div>
            )}

            <div className="mb-5">
              <label htmlFor="admin-email" className="block text-sm font-medium text-gray-400 mb-2">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black/50 border border-prussian rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange/50 transition-colors text-sm"
                placeholder="admin@example.com"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black/50 border border-prussian rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange/50 transition-colors text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-orange hover:bg-orange/80 disabled:bg-orange/40 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-md text-sm"
            >
              {loginLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* ── Demo Mode Announcement Bar ── */}
      {isDemo && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-4 md:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
              🧪 Demo Mode
            </span>
            <p className="text-xs md:text-sm text-gray-200">
              Interactive test dashboard. Changes are stored in your browser without requiring Supabase.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetDemoData}
              className="px-3 py-1 rounded text-xs font-medium bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 transition-colors"
            >
              Reset Demo Data
            </button>
            <Link
              href="/admin"
              className="px-3 py-1 rounded text-xs font-bold bg-orange hover:bg-orange/80 text-white transition-colors"
            >
              Go to Real Admin Login ➔
            </Link>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 max-w-6xl pt-8">

        {/* ── Top Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white mb-1">Admin Dashboard</h1>
              {isDemo && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Demo
                </span>
              )}
            </div>
            <p className="text-gray-400">
              {activeTab === 'articles' && 'Manage and preview your blog articles'}
              {activeTab === 'newsletters' && 'Manage and preview newsletter PDF issues'}
              {activeTab === 'events' && 'Manage, preview, and organize association events'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'articles' && (
              <Link
                href={isDemo ? '/admin/editor?demo=true' : '/admin/editor'}
                className="bg-orange hover:bg-orange/80 text-white font-bold py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2 text-sm shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Article
              </Link>
            )}

            {activeTab === 'newsletters' && (
              <Link
                href={isDemo ? '/admin/newsletters/upload?demo=true' : '/admin/newsletters/upload'}
                className="bg-orange hover:bg-orange/80 text-white font-bold py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2 text-sm shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Newsletter
              </Link>
            )}

            {activeTab === 'events' && (
              <Link
                href={isDemo ? '/admin/events/create?demo=true' : '/admin/events/create'}
                className="bg-orange hover:bg-orange/80 text-white font-bold py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2 text-sm shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Event
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="bg-prussian/40 hover:bg-prussian/60 text-gray-300 font-medium py-2.5 px-4 rounded-lg transition-colors border border-prussian/50 text-sm"
            >
              {isDemo ? 'Exit Demo' : 'Logout'}
            </button>
          </div>
        </div>

        {/* ── Main Category Tabs: Articles | Newsletters | Events ── */}
        <div className="flex items-center gap-2 border-b border-prussian/50 pb-4 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'articles'
                ? 'bg-orange text-white shadow-md'
                : 'bg-prussian/30 text-gray-400 hover:text-white border border-prussian/50'
            }`}
          >
            <span>📝</span> Articles ({articles.length})
          </button>

          <button
            onClick={() => setActiveTab('newsletters')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'newsletters'
                ? 'bg-orange text-white shadow-md'
                : 'bg-prussian/30 text-gray-400 hover:text-white border border-prussian/50'
            }`}
          >
            <span>📰</span> Newsletters ({newsletters.length})
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'events'
                ? 'bg-orange text-white shadow-md'
                : 'bg-prussian/30 text-gray-400 hover:text-white border border-prussian/50'
            }`}
          >
            <span>📅</span> Events ({events.length})
          </button>
        </div>

        {/* ── TAB 1: ARTICLES ── */}
        {activeTab === 'articles' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-prussian/20 backdrop-blur-sm rounded-xl p-5 border border-prussian/50">
                <p className="text-gray-400 text-sm mb-1">Total Articles</p>
                <p className="text-3xl font-bold text-white">{articles.length}</p>
              </div>
              <div className="bg-prussian/20 backdrop-blur-sm rounded-xl p-5 border border-prussian/50">
                <p className="text-gray-400 text-sm mb-1">Published</p>
                <p className="text-3xl font-bold text-green-400">
                  {articles.filter((a) => a.published).length}
                </p>
              </div>
              <div className="bg-prussian/20 backdrop-blur-sm rounded-xl p-5 border border-prussian/50">
                <p className="text-gray-400 text-sm mb-1">Drafts</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {articles.filter((a) => !a.published).length}
                </p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setArticleFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  articleFilter === 'all'
                    ? 'bg-orange text-white'
                    : 'bg-prussian/40 text-gray-400 hover:text-white border border-prussian/50'
                }`}
              >
                All ({articles.length})
              </button>
              <button
                onClick={() => setArticleFilter('published')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  articleFilter === 'published'
                    ? 'bg-green-600 text-white'
                    : 'bg-prussian/40 text-gray-400 hover:text-white border border-prussian/50'
                }`}
              >
                Published ({articles.filter((a) => a.published).length})
              </button>
              <button
                onClick={() => setArticleFilter('draft')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  articleFilter === 'draft'
                    ? 'bg-amber-600 text-white'
                    : 'bg-prussian/40 text-gray-400 hover:text-white border border-prussian/50'
                }`}
              >
                Drafts ({articles.filter((a) => !a.published).length})
              </button>
            </div>

            {/* Articles List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-prussian/20 rounded-xl animate-pulse h-20 border border-prussian/30" />
                ))}
              </div>
            ) : filteredArticles.length > 0 ? (
              <div className="space-y-3">
                {filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="bg-prussian/20 backdrop-blur-sm rounded-xl p-5 border border-prussian/50 hover:border-prussian transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-white truncate">
                            {article.title}
                          </h3>
                          <span
                            className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                              article.published
                                ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                            }`}
                          >
                            {article.published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          By {article.author} •{' '}
                          {new Date(article.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Live preview for drafts or view for published */}
                        {article.published ? (
                          <Link
                            href={`/blog/${article.slug}`}
                            target="_blank"
                            className="p-2 text-gray-400 hover:text-white hover:bg-prussian/50 rounded-lg transition-colors"
                            title="View published article"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPreviewItem({ type: 'article', data: article })}
                            className="px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:text-white hover:bg-amber-500/20 border border-amber-500/40 rounded-lg transition-colors flex items-center gap-1.5"
                            title="Preview how this draft will look before publishing"
                          >
                            <span>👁️</span> Preview Draft
                          </button>
                        )}

                        <button
                          onClick={() => toggleArticlePublished(article)}
                          className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-orange hover:bg-prussian/50 rounded-lg transition-colors whitespace-nowrap"
                        >
                          {article.published ? 'Unpublish' : 'Publish'}
                        </button>

                        <Link
                          href={isDemo ? `/admin/editor/${article.slug}?demo=true` : `/admin/editor/${article.slug}`}
                          className="p-2 text-gray-400 hover:text-orange hover:bg-prussian/50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>

                        <button
                          onClick={() => deleteArticle(article.id, article.title)}
                          disabled={deletingId === article.id}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-prussian/10 rounded-2xl border border-prussian/30">
                <p className="text-gray-400 mb-4">No articles found in this filter.</p>
                <Link
                  href={isDemo ? "/admin/editor?demo=true" : "/admin/editor"}
                  className="inline-block bg-orange hover:bg-orange/80 text-white font-bold py-2 px-5 rounded-lg text-sm transition-colors"
                >
                  Create Article
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: NEWSLETTERS ── */}
        {activeTab === 'newsletters' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-prussian/20 backdrop-blur-sm rounded-xl p-5 border border-prussian/50">
                <p className="text-gray-400 text-sm mb-1">Total Newsletters</p>
                <p className="text-3xl font-bold text-white">{newsletters.length}</p>
              </div>
              <div className="bg-prussian/20 backdrop-blur-sm rounded-xl p-5 border border-prussian/50">
                <p className="text-gray-400 text-sm mb-1">Published</p>
                <p className="text-3xl font-bold text-green-400">
                  {newsletters.filter((n) => n.published).length}
                </p>
              </div>
              <div className="bg-prussian/20 backdrop-blur-sm rounded-xl p-5 border border-prussian/50">
                <p className="text-gray-400 text-sm mb-1">Drafts</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {newsletters.filter((n) => !n.published).length}
                </p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNewsletterFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  newsletterFilter === 'all'
                    ? 'bg-orange text-white'
                    : 'bg-prussian/40 text-gray-400 hover:text-white border border-prussian/50'
                }`}
              >
                All ({newsletters.length})
              </button>
              <button
                onClick={() => setNewsletterFilter('published')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  newsletterFilter === 'published'
                    ? 'bg-green-600 text-white'
                    : 'bg-prussian/40 text-gray-400 hover:text-white border border-prussian/50'
                }`}
              >
                Published ({newsletters.filter((n) => n.published).length})
              </button>
              <button
                onClick={() => setNewsletterFilter('draft')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  newsletterFilter === 'draft'
                    ? 'bg-amber-600 text-white'
                    : 'bg-prussian/40 text-gray-400 hover:text-white border border-prussian/50'
                }`}
              >
                Drafts ({newsletters.filter((n) => !n.published).length})
              </button>
            </div>

            {/* Newsletters List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-prussian/20 rounded-xl animate-pulse h-20 border border-prussian/30" />
                ))}
              </div>
            ) : filteredNewsletters.length > 0 ? (
              <div className="space-y-3">
                {filteredNewsletters.map((n) => (
                  <div
                    key={n.id}
                    className="bg-prussian/20 backdrop-blur-sm rounded-xl p-5 border border-prussian/50 hover:border-prussian transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="text-lg font-semibold text-white truncate">{n.title}</h3>
                          <span
                            className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                              n.published
                                ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                            }`}
                          >
                            {n.published ? 'Published' : 'Draft'}
                          </span>
                          {n.issue && (
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-prussian/40 text-gray-400 border border-prussian/50">
                              {n.issue}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">
                          {new Date(n.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          • {formatBytes(n.file_size_bytes)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {n.published ? (
                          <Link
                            href={`/newsletter/${n.slug}`}
                            target="_blank"
                            className="p-2 text-gray-400 hover:text-white hover:bg-prussian/50 rounded-lg transition-colors"
                            title="View published newsletter"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPreviewItem({ type: 'newsletter', data: n })}
                            className="px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:text-white hover:bg-amber-500/20 border border-amber-500/40 rounded-lg transition-colors flex items-center gap-1.5"
                            title="Preview how this draft newsletter looks"
                          >
                            <span>👁️</span> Preview Draft
                          </button>
                        )}

                        <button
                          onClick={() => toggleNewsletterPublished(n)}
                          className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-orange hover:bg-prussian/50 rounded-lg transition-colors whitespace-nowrap"
                        >
                          {n.published ? 'Unpublish' : 'Publish'}
                        </button>

                        <button
                          onClick={() => deleteNewsletter(n)}
                          disabled={deletingId === n.id}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-prussian/10 rounded-2xl border border-prussian/30">
                <p className="text-gray-400 mb-4">No newsletters found in this filter.</p>
                <Link
                  href={isDemo ? "/admin/newsletters/upload?demo=true" : "/admin/newsletters/upload"}
                  className="inline-block bg-orange hover:bg-orange/80 text-white font-bold py-2 px-5 rounded-lg text-sm transition-colors"
                >
                  Upload Newsletter
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: EVENTS ── */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-prussian/20 backdrop-blur-sm rounded-xl p-5 border border-prussian/50">
                <p className="text-gray-400 text-sm mb-1">Total Events</p>
                <p className="text-3xl font-bold text-white">{events.length}</p>
              </div>
              <div className="bg-prussian/20 backdrop-blur-sm rounded-xl p-5 border border-prussian/50">
                <p className="text-gray-400 text-sm mb-1">Upcoming</p>
                <p className="text-3xl font-bold text-emerald-400">
                  {events.filter((e) => e.status === 'upcoming').length}
                </p>
              </div>
              <div className="bg-prussian/20 backdrop-blur-sm rounded-xl p-5 border border-prussian/50">
                <p className="text-gray-400 text-sm mb-1">Conducted</p>
                <p className="text-3xl font-bold text-sky-400">
                  {events.filter((e) => e.status === 'past').length}
                </p>
              </div>
              <div className="bg-prussian/20 backdrop-blur-sm rounded-xl p-5 border border-prussian/50">
                <p className="text-gray-400 text-sm mb-1">Drafts</p>
                <p className="text-3xl font-bold text-amber-400">
                  {events.filter((e) => !e.published).length}
                </p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEventFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  eventFilter === 'all'
                    ? 'bg-orange text-white'
                    : 'bg-prussian/40 text-gray-400 hover:text-white border border-prussian/50'
                }`}
              >
                All ({events.length})
              </button>
              <button
                onClick={() => setEventFilter('upcoming')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  eventFilter === 'upcoming'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-prussian/40 text-gray-400 hover:text-white border border-prussian/50'
                }`}
              >
                Upcoming ({events.filter((e) => e.status === 'upcoming').length})
              </button>
              <button
                onClick={() => setEventFilter('past')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  eventFilter === 'past'
                    ? 'bg-sky-700 text-white'
                    : 'bg-prussian/40 text-gray-400 hover:text-white border border-prussian/50'
                }`}
              >
                Conducted ({events.filter((e) => e.status === 'past').length})
              </button>
              <button
                onClick={() => setEventFilter('draft')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  eventFilter === 'draft'
                    ? 'bg-amber-600 text-white'
                    : 'bg-prussian/40 text-gray-400 hover:text-white border border-prussian/50'
                }`}
              >
                Drafts ({events.filter((e) => !e.published).length})
              </button>
            </div>

            {/* Events List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-prussian/20 rounded-xl animate-pulse h-20 border border-prussian/30" />
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
                            <button
                              type="button"
                              onClick={() => setPreviewItem({ type: 'event', data: event })}
                              className="px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:text-white hover:bg-amber-500/20 border border-amber-500/40 rounded-lg transition-colors flex items-center gap-1.5"
                              title="Preview how this draft event looks"
                            >
                              <span>👁️</span> Preview Draft
                            </button>
                          )}

                          <button
                            onClick={() => toggleEventPublished(event)}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-orange hover:bg-prussian/50 rounded-lg transition-colors"
                          >
                            {event.published ? 'Unpublish' : 'Publish'}
                          </button>

                          <Link
                            href={isDemo ? `/admin/events/edit/${event.id}?demo=true` : `/admin/events/edit/${event.id}`}
                            className="p-2 text-gray-400 hover:text-orange hover:bg-prussian/50 rounded-lg transition-colors"
                            title="Edit event"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>

                          <button
                            onClick={() => deleteEvent(event.id, event.title)}
                            disabled={deletingId === event.id}
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
              <div className="text-center py-16 bg-prussian/10 rounded-2xl border border-prussian/30">
                <p className="text-gray-400 mb-4">No events found in this filter.</p>
                <Link
                  href={isDemo ? "/admin/events/create?demo=true" : "/admin/events/create"}
                  className="inline-block bg-orange hover:bg-orange/80 text-white font-bold py-2 px-5 rounded-lg text-sm transition-colors"
                >
                  Add Event
                </Link>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── LIVE DRAFT PREVIEW MODAL (Tells you how it will look before publishing) ── */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
          >
            {/* Modal Top Bar */}
            <div className="px-6 py-4 bg-amber-500 text-black flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-base">👁️</span>
                <span className="font-bold text-sm tracking-wide uppercase">
                  Draft Preview: How it will look on the website
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-black/20 font-bold uppercase">
                  Unpublished
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-black flex items-center justify-center font-bold text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Exact Website Layout */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 text-text">
              
              {/* ARTICLE PREVIEW */}
              {previewItem.type === 'article' && (
                <div>
                  <div className="text-center max-w-2xl mx-auto mb-8">
                    {previewItem.data.tags?.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-2 mb-4">
                        {previewItem.data.tags.map((t: string) => (
                          <span key={t} className="text-xs font-yanone uppercase px-2.5 py-0.5 rounded border border-border text-text-dim">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <h1 className="text-3xl md:text-5xl font-display font-medium text-text mb-4 leading-tight">
                      {previewItem.data.title}
                    </h1>
                    <p className="text-sm uppercase tracking-wider font-yanone text-text-dim">
                      By <span className="text-accent font-semibold">{previewItem.data.author || 'Author'}</span> • {new Date(previewItem.data.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>

                  {previewItem.data.cover_image && (
                    <div className="aspect-[21/9] rounded-lg overflow-hidden border border-border mb-8 bg-black/40">
                      <img src={previewItem.data.cover_image} alt={previewItem.data.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="p-6 md:p-10 border rounded-lg bg-bg-surface text-text prose dark:prose-invert max-w-none leading-relaxed" style={{ borderColor: 'var(--border)' }}>
                    <MarkdownRenderer content={previewItem.data.content || '*No content written yet.*'} />
                  </div>
                </div>
              )}

              {/* NEWSLETTER PREVIEW */}
              {previewItem.type === 'newsletter' && (
                <div className="max-w-md mx-auto">
                  <p className="text-xs font-yanone uppercase tracking-widest text-accent mb-3">Newsletter Archive Card View</p>
                  <div className="border bg-bg-surface p-6 rounded shadow-sm" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-4">
                      {previewItem.data.issue ? (
                        <span className="text-xl font-yanone uppercase tracking-widest text-accent border border-accent/30 px-3 py-1">
                          {previewItem.data.issue}
                        </span>
                      ) : (
                        <span className="text-xs uppercase text-text-dim">Issue #</span>
                      )}
                      <span className="text-xs text-text-dim uppercase font-semibold">
                        {formatBytes(previewItem.data.file_size_bytes)}
                      </span>
                    </div>
                    <h3 className="text-2xl font-display text-text mb-2">
                      {previewItem.data.title}
                    </h3>
                    <p className="text-sm text-text-dim line-clamp-3 mb-6">
                      {previewItem.data.description || 'No description entered.'}
                    </p>
                    <div className="border-t pt-4 text-accent font-yanone uppercase text-lg tracking-wider flex items-center justify-between">
                      <span>Read Document →</span>
                      {previewItem.data.file_url && (
                        <a
                          href={previewItem.data.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs normal-case underline text-text-dim hover:text-accent"
                        >
                          View PDF File ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* EVENT PREVIEW */}
              {previewItem.type === 'event' && (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-yanone uppercase tracking-widest text-accent mb-3">How it appears on the Events page grid</p>
                    <div className="max-w-md">
                      <EventCard event={previewItem.data} />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-yanone uppercase tracking-widest text-accent mb-3">How it appears on the full Event Detail page (`/events/{previewItem.data.slug}`)</p>
                    <div className="border rounded-xl p-6 bg-bg-surface" style={{ borderColor: 'var(--border)' }}>
                      <div className="h-48 rounded-lg overflow-hidden relative mb-6">
                        <img
                          src={previewItem.data.image_url || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=80'}
                          alt={previewItem.data.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-emerald-500 text-white">
                            {previewItem.data.status}
                          </span>
                          {previewItem.data.category && (
                            <span className="px-2.5 py-0.5 rounded text-xs uppercase bg-black/40 text-white border border-white/20">
                              {previewItem.data.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <h2 className="text-2xl font-display text-text mb-3">{previewItem.data.title}</h2>
                      <p className="text-sm text-text-dim mb-4">
                        📍 {previewItem.data.location || 'Venue TBD'} • 📅 {previewItem.data.time || 'Time TBD'}
                      </p>
                      <div className="prose dark:prose-invert max-w-none text-sm text-text-dim">
                        <MarkdownRenderer content={previewItem.data.description || '*No description.*'} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Bottom Bar */}
            <div className="px-6 py-4 bg-prussian/40 border-t border-prussian/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div>
                {previewItem.type === 'article' && (
                  <Link
                    href={`/blog/${previewItem.data.slug}?preview=true`}
                    target="_blank"
                    className="text-xs text-orange hover:underline font-semibold flex items-center gap-1"
                  >
                    Open Full Page Preview in New Tab ↗
                  </Link>
                )}
                {previewItem.type === 'newsletter' && (
                  <Link
                    href={`/newsletter/${previewItem.data.slug}?preview=true`}
                    target="_blank"
                    className="text-xs text-orange hover:underline font-semibold flex items-center gap-1"
                  >
                    Open Full Page Preview in New Tab ↗
                  </Link>
                )}
                {previewItem.type === 'event' && (
                  <Link
                    href={`/events/${previewItem.data.slug}?preview=true`}
                    target="_blank"
                    className="text-xs text-orange hover:underline font-semibold flex items-center gap-1"
                  >
                    Open Full Page Preview in New Tab ↗
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white border border-prussian/60"
                >
                  Close
                </button>

                {/* Publish directly from preview */}
                <button
                  type="button"
                  onClick={() => {
                    if (previewItem.type === 'article') toggleArticlePublished(previewItem.data);
                    if (previewItem.type === 'newsletter') toggleNewsletterPublished(previewItem.data);
                    if (previewItem.type === 'event') toggleEventPublished(previewItem.data);
                  }}
                  className="px-5 py-2 rounded-lg text-sm font-bold bg-green-600 hover:bg-green-500 text-white shadow-md transition-colors"
                >
                  Publish Now
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboardContent;
