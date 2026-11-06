'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Newsletter } from '@/lib/types';
import { formatBytes } from '@/lib/format';
import { checkAdminSession } from '@/lib/eventsStorage';
import toast from 'react-hot-toast';

export default function AdminNewslettersPage() {
  const router = useRouter();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const isAuth = await checkAdminSession();
    if (!isAuth) {
      router.push('/admin');
      return;
    }
    setAuthenticated(true);
    fetchNewsletters();
  }

  async function fetchNewsletters() {
    if (!supabase) {
      setNewsletters([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('newsletters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch newsletters');
      setLoading(false);
      return;
    }

    setNewsletters(data || []);
    setLoading(false);
  }

  async function handleDelete(newsletter: Newsletter) {
    if (!confirm(`Are you sure you want to delete "${newsletter.title}"?`)) return;

    setDeleting(newsletter.id);

    const { error: storageError } = await supabase.storage
      .from('newsletters')
      .remove([newsletter.file_path]);

    if (storageError) {
      toast.error('Failed to delete PDF file: ' + storageError.message);
      setDeleting(null);
      return;
    }

    const { error } = await supabase.from('newsletters').delete().eq('id', newsletter.id);

    if (error) {
      toast.error('Failed to delete newsletter record');
      setDeleting(null);
      return;
    }

    toast.success('Newsletter deleted');
    setNewsletters((prev) => prev.filter((n) => n.id !== newsletter.id));
    setDeleting(null);
  }

  async function togglePublished(newsletter: Newsletter) {
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
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-prussian border-t-orange rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen pt-8 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <Link
                href="/admin"
                className="text-gray-400 hover:text-orange transition-colors text-sm mb-2 inline-flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-white mb-1">Newsletters</h1>
              <p className="text-gray-400">Manage and preview newsletter PDF issues</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin/newsletters/upload"
                className="bg-orange hover:bg-orange/80 text-white font-bold py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Newsletter
              </Link>
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
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap bg-orange text-white shadow-md"
            >
              <span>📰</span> Newsletters ({newsletters.length})
            </Link>
            <Link
              href="/admin?tab=events"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap bg-prussian/30 text-gray-400 hover:text-white border border-prussian/50"
            >
              <span>📅</span> Events
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-prussian/20 rounded-xl animate-pulse h-24 border border-prussian/30" />
              ))}
            </div>
          ) : newsletters.length > 0 ? (
            <div className="space-y-3">
              {newsletters.map((n) => {
                return (
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
                        <p className="text-gray-500 text-sm">
                          {new Date(n.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                          {' · '}
                          {formatBytes(n.file_size_bytes)}
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
                          <Link
                            href={`/newsletter/${n.slug}?preview=true`}
                            target="_blank"
                            className="px-2.5 py-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1.5"
                            title="Preview how draft newsletter looks"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>Preview Draft</span>
                          </Link>
                        )}
                        <button
                          onClick={() => togglePublished(n)}
                          className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-orange hover:bg-prussian/50 rounded-lg transition-colors whitespace-nowrap"
                        >
                          {n.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDelete(n)}
                          disabled={deleting === n.id}
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
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-prussian/10 rounded-2xl border border-prussian/30">
              <h3 className="text-xl font-bold text-white mb-2">No newsletters yet</h3>
              <p className="text-gray-500">Upload your first newsletter PDF to get started.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
