'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { Newsletter } from '@/lib/types';

const PdfViewer = dynamic(() => import('@/components/PdfViewer'), {
  ssr: false,
  loading: () => <div className="py-24 flex items-center justify-center"><div className="text-sm font-semibold tracking-widest uppercase text-text-muted">Loading Document...</div></div>,
});

export default function NewsletterViewerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const isPreview = searchParams?.get('preview') === 'true';

  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => { fetchNewsletter(); }, [slug, isPreview]);

  async function fetchNewsletter() {
    if (!supabase) { setNotFound(true); setLoading(false); return; }
    let query = supabase.from('newsletters').select('*').eq('slug', slug);
    if (!isPreview) {
      query = query.eq('published', true);
    }
    const { data, error } = await query.single();
    if (error || !data) { setNotFound(true); setLoading(false); return; }
    setNewsletter(data as Newsletter);
    setLoading(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-sm font-semibold tracking-widest uppercase text-text-muted">Searching Archives...</div></div>;
  if (notFound || !newsletter) return <div className="min-h-screen flex flex-col items-center justify-center"><h1 className="text-5xl text-text mb-4 font-display">Not Found</h1><button onClick={() => router.push('/newsletter')} className="btn-accent">Return</button></div>;

  return (
    <>
      {(!newsletter.published || isPreview) && (
        <div className="bg-amber-500 text-black px-4 py-2.5 text-center text-xs md:text-sm font-semibold tracking-wide sticky top-0 z-50 flex flex-wrap items-center justify-center gap-3 shadow-md">
          <span>👁️ DRAFT PREVIEW MODE — This is how your newsletter will look once published. It is currently unpublished.</span>
          <Link href="/admin/newsletters" className="underline font-bold hover:text-white transition-colors">
            Back to Newsletters
          </Link>
        </div>
      )}
      <div className="min-h-screen pt-16 pb-24 bg-transparent">
      <div className="container mx-auto px-5 md:px-8 relative z-10">
        <div className="max-w-[1000px] mx-auto mb-16 text-center">
          <button onClick={() => router.push('/newsletter')} className="text-xl font-yanone uppercase tracking-[0.1em] text-text-muted hover:text-accent transition-colors mb-12 inline-flex items-center gap-2"><span>←</span> Back to Newsletters</button>
          <div className="mb-6">
            {newsletter.issue && <span className="text-xl font-yanone uppercase tracking-[0.1em] text-accent border border-accent/30 px-3 py-1">{newsletter.issue}</span>}
          </div>
          <h1 className="text-4xl md:text-6xl text-text mb-8 font-display leading-[1.1]">{newsletter.title}</h1>
          {newsletter.description && <p className="text-lg text-text-dim mt-4 max-w-2xl mx-auto leading-relaxed">{newsletter.description}</p>}
        </div>
        <div className="max-w-[1200px] mx-auto border p-4 md:p-12 bg-bg-surface" style={{ borderColor: 'var(--border)' }}>
          <PdfViewer url={newsletter.file_url} />
        </div>
      </div>
    </div>
    </>
  );
}
