'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Newsletter } from '@/lib/types';
import toast from 'react-hot-toast';

function UploadNewsletterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get('demo') === 'true';

  const [authenticated, setAuthenticated] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [issue, setIssue] = useState('');
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
      );
    }
  }, [title, slugManuallyEdited]);

  async function checkAuth() {
    if (isDemo) {
      setAuthenticated(true);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/admin');
      return;
    }
    setAuthenticated(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;

    if (!selected) {
      setFile(null);
      return;
    }

    if (selected.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      e.target.value = '';
      setFile(null);
      return;
    }

    setFile(selected);
    if (!title) {
      setTitle(selected.name.replace(/\.pdf$/i, ''));
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!title || !slug || !file) {
      toast.error('Title, slug, and a PDF file are required');
      return;
    }

    setUploading(true);

    if (isDemo) {
      const newNewsletter: Newsletter = {
        id: 'demo-news-' + Date.now(),
        title,
        slug,
        description,
        issue: issue || '1',
        file_path: file.name,
        file_url: '#',
        file_size_bytes: file.size,
        original_size_bytes: file.size,
        published,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        const raw = localStorage.getItem('pa_demo_newsletters');
        const list = raw ? JSON.parse(raw) : [];
        list.unshift(newNewsletter);
        localStorage.setItem('pa_demo_newsletters', JSON.stringify(list));
      } catch {}

      toast.success(published ? 'Newsletter published (Demo)!' : 'Newsletter saved as draft (Demo)!');
      router.push('/demo?tab=newsletters');
      return;
    }

    const safeName = file.name.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9-_]+/g, '-').toLowerCase();
    const filePath = `${Date.now()}-${safeName || 'newsletter'}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('newsletters')
      .upload(filePath, file, { contentType: 'application/pdf', upsert: false });

    if (uploadError) {
      toast.error('Failed to upload PDF: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('newsletters').getPublicUrl(filePath);

    const { error: insertError } = await supabase.from('newsletters').insert({
      title,
      slug,
      issue,
      description,
      file_path: filePath,
      file_url: publicUrlData.publicUrl,
      file_size_bytes: file.size,
      original_size_bytes: file.size,
      published,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        toast.error('A newsletter with this slug already exists');
      } else {
        toast.error('Failed to save newsletter record: ' + insertError.message);
      }
      await supabase.storage.from('newsletters').remove([filePath]);
      setUploading(false);
      return;
    }

    toast.success(published ? 'Newsletter published!' : 'Newsletter saved as draft!');
    router.push('/admin?tab=newsletters');
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
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link
                href={isDemo ? '/demo?tab=newsletters' : '/admin?tab=newsletters'}
                className="text-gray-400 hover:text-orange transition-colors text-sm mb-2 inline-flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Newsletters
              </Link>
              <h1 className="text-3xl font-bold text-white">Upload Newsletter</h1>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="py-2 px-4 rounded-lg font-medium text-xs bg-prussian/40 hover:bg-prussian/60 border border-prussian/50 text-gray-300 transition-colors flex items-center gap-1.5"
            >
              <span>👁️</span> {showPreview ? 'Back to Form' : 'Preview How It Will Look'}
            </button>
          </div>

          {showPreview ? (
            <div className="space-y-6">
              <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-5 py-4 rounded-xl flex items-center justify-between text-sm">
                <div>
                  <p className="font-bold">👁️ Draft Preview: Newsletter Archive Card</p>
                  <p className="text-xs text-amber-200/80 mt-0.5">
                    This is how this newsletter will look on the public Newsletter Archive page (`/newsletter`).
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

              <div className="p-8 rounded-2xl border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                <div className="max-w-sm border bg-bg-surface p-6 rounded shadow-sm" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-yanone uppercase tracking-widest text-accent border border-accent/30 px-3 py-1">
                      {issue || 'Issue #1'}
                    </span>
                    <span className="text-xs text-text-dim uppercase tracking-wider font-semibold">
                      {file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : 'PDF Document'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-display text-text mb-2">
                    {title || 'Untitled Newsletter'}
                  </h3>
                  <p className="text-sm text-text-dim line-clamp-3 mb-6">
                    {description || 'No description entered yet.'}
                  </p>
                  <div className="border-t pt-4 text-accent font-yanone uppercase text-lg tracking-wider">
                    Read Now →
                  </div>
                </div>
              </div>
            </div>
          ) : (

          <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-prussian/20 backdrop-blur-sm rounded-2xl p-8 border border-prussian/50 space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-2">
                  Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-prussian rounded-lg text-white text-lg font-semibold placeholder-gray-600 focus:outline-none focus:border-orange/50 transition-colors"
                  placeholder="Physics Association Newsletter"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-400 mb-2">
                  Slug * <span className="text-gray-600">(URL-friendly identifier)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-sm">/newsletter/</span>
                  <input
                    id="slug"
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugManuallyEdited(true);
                    }}
                    required
                    className="flex-1 px-4 py-3 bg-black/50 border border-prussian rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange/50 transition-colors font-mono text-sm"
                    placeholder="march-2026-issue"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="issue" className="block text-sm font-medium text-gray-400 mb-2">
                    Issue <span className="text-gray-600">(optional)</span>
                  </label>
                  <input
                    id="issue"
                    type="text"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-prussian rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange/50 transition-colors"
                    placeholder="Issue #4 — Spring 2026"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-2">
                  Description <span className="text-gray-600">(optional)</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-black/50 border border-prussian rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange/50 transition-colors resize-none"
                  placeholder="A short summary of what's in this issue..."
                />
              </div>

              {/* PDF File */}
              <div>
                <label htmlFor="pdf" className="block text-sm font-medium text-gray-400 mb-2">
                  PDF File *
                </label>
                <input
                  id="pdf"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  required
                  className="w-full text-sm text-gray-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:bg-orange file:text-white file:font-medium file:cursor-pointer hover:file:bg-orange/80 bg-black/50 border border-prussian rounded-lg px-4 py-2.5 cursor-pointer"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-prussian/20 backdrop-blur-sm rounded-2xl p-6 border border-prussian/50">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-prussian rounded-full peer-checked:bg-orange transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                </div>
                <span className="text-gray-300 font-medium">
                  {published ? 'Publish immediately' : 'Save as draft'}
                </span>
              </label>

              <div className="flex gap-3">
                <Link
                  href="/admin/newsletters"
                  className="py-2.5 px-6 rounded-lg font-medium text-gray-300 bg-prussian/40 hover:bg-prussian/60 border border-prussian/50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={uploading || !file || !slug}
                  className="bg-orange hover:bg-orange/80 disabled:bg-orange/40 text-white font-bold py-2.5 px-8 rounded-lg transition-colors flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    published ? 'Publish' : 'Save Draft'
                  )}
                </button>
              </div>
            </div>
          </form>
          )}
        </div>
      </div>
    </>
  );
}

export default function UploadNewsletterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-prussian border-t-orange rounded-full animate-spin" />
        </div>
      }
    >
      <UploadNewsletterForm />
    </Suspense>
  );
}
