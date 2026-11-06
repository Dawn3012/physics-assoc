'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Newsletter } from '@/lib/types';
import dynamic from 'next/dynamic';
import XkcdStrip from '@/components/XkcdStrip';
import { XKCD_COMICS } from '@/constants/xkcd';

const PdfThumbnail = dynamic(() => import('@/components/PdfThumbnail'), { 
  ssr: false,
  loading: () => <div className="h-48 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">Loading Cover...</div>
});

export default function NewsletterPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNewsletters(); }, []);

  async function fetchNewsletters() {
    const { data, error } = await supabase.from('newsletters').select('*').eq('published', true).order('created_at', { ascending: false });
    if (error) { console.error(error); setLoading(false); return; }
    setNewsletters(data || []);
    setLoading(false);
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  return (
    <main className="min-h-screen bg-transparent">
      <section className="pt-16 pb-24 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-[1400px] mx-auto px-5 md:px-8">
          <div className="mb-6"><span className="text-xl uppercase tracking-[0.2em] font-yanone text-accent">Archive</span></div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <h1 className="text-[4rem] md:text-[6.5rem] text-text leading-[1.05] tracking-tight font-display">
                The <span className="font-lobster text-accent lowercase text-[5rem] md:text-[8rem] inline-block transform -rotate-2">Newsletter</span>
              </h1>
              <p className="text-lg md:text-xl text-text-dim leading-relaxed mt-8 max-w-2xl">
                Read our beautifully crafted physics newsletters. Download the PDFs or read them directly in your browser.
              </p>
            </div>
            <div className="lg:max-w-md w-full shrink-0">
              <XkcdStrip comic={XKCD_COMICS.teachingPhysics} maxWidth="max-w-md" className="!py-0 !px-0" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24" style={{ background: 'var(--bg-raised)' }}>
        <div className="max-w-[1400px] mx-auto px-5 md:px-8">
          <div className="mb-16 flex items-center gap-4"><span className="text-2xl font-yanone uppercase tracking-[0.2em] text-accent">Past Issues</span><div className="w-12 h-px bg-border" /></div>
          {loading ? (
             <div className="space-y-6">{[1, 2, 3].map((i) => <div key={i} className="h-40 border bg-bg-surface animate-pulse" style={{ borderColor: 'var(--border)' }} />)}</div>
          ) : newsletters.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-10">
              {newsletters.map((newsletter, i) => (
                <div key={newsletter.id} className="border bg-bg-surface hover:border-accent transition-all duration-300 flex flex-col overflow-hidden group" style={{ borderColor: 'var(--border)' }}>
                  <Link href={`/newsletter/${newsletter.slug}`} className="block h-48 md:h-64 overflow-hidden relative bg-[var(--bg)] border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="absolute top-0 left-0 w-full flex justify-center pointer-events-none transform transition-transform duration-700 group-hover:-translate-y-4">
                      <PdfThumbnail url={newsletter.file_url} />
                    </div>
                  </Link>
                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-xl font-yanone uppercase tracking-[0.1em] text-accent">{newsletter.issue || `Issue #${newsletters.length - i}`}</span>
                      <span className="text-lg text-text-muted font-yanone uppercase tracking-[0.1em]">
                        {new Date(newsletter.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <Link href={`/newsletter/${newsletter.slug}`}>
                      <h3 className="text-4xl text-text mb-4 hover:text-accent transition-colors font-display leading-tight">
                        {newsletter.title}
                      </h3>
                    </Link>
                    <p className="text-[0.95rem] text-text-dim mb-10 line-clamp-2 leading-relaxed">{newsletter.description}</p>
                    <div className="flex items-center justify-between mt-auto border-t pt-6" style={{ borderColor: 'var(--border)' }}>
                      <Link href={`/newsletter/${newsletter.slug}`} className="text-xl font-yanone uppercase tracking-[0.1em] text-text hover:text-accent transition-colors">Read Now →</Link>
                      <a href={newsletter.file_url} download className="text-lg font-yanone tracking-[0.1em] text-text-muted hover:text-accent transition-colors uppercase">PDF ({formatBytes(newsletter.file_size_bytes)})</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 border bg-bg-surface" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-4xl text-text font-display mb-4">No newsletters available</h3>
              <p className="text-text-dim">We&apos;re currently working on our first issue.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
