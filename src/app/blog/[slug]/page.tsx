'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Article } from '@/lib/types';
import MarkdownRenderer from '@/components/MarkdownRenderer';

export default function ArticlePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const isPreview = searchParams?.get('preview') === 'true';

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => { fetchArticle(); }, [slug, isPreview]);

  async function fetchArticle() {
    if (!supabase) { setNotFound(true); setLoading(false); return; }
    let query = supabase.from('articles').select('*').eq('slug', slug);
    if (!isPreview) {
      query = query.eq('published', true);
    }
    const { data, error } = await query.single();
    if (error || !data) { setNotFound(true); setLoading(false); return; }
    setArticle(data as Article);
    setNotFound(false);
    setLoading(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-sm font-semibold tracking-widest uppercase text-text-muted">Loading...</div></div>;
  if (notFound || !article) return <div className="min-h-screen flex flex-col items-center justify-center"><h1 className="text-5xl text-text mb-4 font-display">Article Not Found</h1><button onClick={() => router.push('/blog')} className="btn-accent">Return</button></div>;

  const formattedDate = new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      {(!article.published || isPreview) && (
        <div className="bg-amber-500 text-black px-4 py-2.5 text-center text-xs md:text-sm font-semibold tracking-wide sticky top-0 z-50 flex flex-wrap items-center justify-center gap-3 shadow-md">
          <span>👁️ DRAFT PREVIEW MODE — This is how your article will look once published. It is currently unpublished.</span>
          <Link href={`/admin/editor/${article.slug}`} className="underline font-bold hover:text-white transition-colors">
            Edit in Admin
          </Link>
        </div>
      )}
      <article className="min-h-screen pt-16 pb-24 bg-transparent">
      <header className="max-w-[1000px] mx-auto px-5 md:px-8 mb-16 relative z-10 text-center">
        <button onClick={() => router.push('/blog')} className="text-xl font-yanone uppercase tracking-[0.1em] text-text-muted hover:text-accent transition-colors mb-12 inline-flex items-center gap-2"><span>←</span> Back to Articles</button>
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {article.tags.map((tag) => <span key={tag} className="text-lg font-yanone uppercase tracking-[0.1em] px-2 py-0 bg-border/20 text-text-muted border border-border">{tag}</span>)}
          </div>
        )}
        <h1 className="text-4xl md:text-6xl text-text mb-8 font-display leading-[1.1]">{article.title}</h1>
        <div className="flex justify-center items-center gap-4 text-xl uppercase tracking-[0.1em] font-yanone text-text-dim">
          <p className="text-accent">{article.author}</p><div className="w-4 h-px bg-border" /><p>{formattedDate}</p>
        </div>
      </header>
      {article.cover_image && (
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 mb-20 relative z-10">
          <div className="relative aspect-[21/9] overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
            <Image src={article.cover_image} alt={article.title} fill unoptimized priority className="object-cover" />
          </div>
        </div>
      )}
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 relative z-10">
        <div className="p-8 md:p-12 border bg-bg-surface" style={{ borderColor: 'var(--border)' }}>
          <MarkdownRenderer content={article.content} />
        </div>
      </div>
    </article>
    </>
  );
}
