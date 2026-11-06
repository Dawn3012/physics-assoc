'use client';

import { useEffect, useState } from 'react';
import { ArticleCard, XkcdStrip } from '@/components';
import { XKCD_COMICS } from '@/constants/xkcd';
import { supabase } from '@/lib/supabase';
import { Article } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);

  useEffect(() => {
    async function fetchFeaturedArticles() {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(3);
      if (!error && data) setFeaturedArticles(data as Article[]);
    }
    fetchFeaturedArticles();
  }, []);

  return (
    <>
      {/* ── Hero / About ── */}
      <section 
        className="pt-16 pb-24 border-b" 
        style={{ background: 'transparent', borderColor: 'var(--border)' }}
      >
        <div className="max-w-[1400px] mx-auto px-5 md:px-8">
          
          <div className="mb-6">
            <span className="text-xl uppercase tracking-[0.2em] text-accent font-yanone">
              About
            </span>
          </div>

          <div className="max-w-4xl">
            <h1 
              className="text-[4rem] md:text-[6.5rem] text-text leading-[1.05] tracking-tight font-medium font-display" 
            >
              Promoting the beautiful language of <br className="hidden md:block"/>
              <span className="text-accent font-lobster text-[5rem] md:text-[8rem] lowercase leading-[0.7] inline-block -rotate-2 transform">physics</span>
              <span className="font-marker text-accent2 text-3xl md:text-5xl absolute mt-4 md:mt-8 ml-2 rotate-12 inline-block">!</span>
            </h1>
          </div>
          
        </div>
      </section>

      {/* ── Mission ── */}
      <section 
        style={{ background: 'var(--bg-surface)' }} 
        className="py-24"
      >
        <div className="max-w-[1400px] mx-auto px-5 md:px-8">
          
          <div className="grid md:grid-cols-2 gap-16 items-start">
            
            {/* Left: Text Content */}
            <div className="flex flex-col">
              
              <div className="flex items-center gap-4 mb-10">
                <span className="text-2xl uppercase tracking-[0.2em] text-accent font-yanone">
                  Mission
                </span>
                <div className="flex-1 h-px bg-border max-w-xs" />
              </div>
              
              <div className="space-y-8 text-[1.1rem] text-text-dim leading-[1.8] max-w-xl">
                <p>
                  We are a bunch of passionate nerds trying to promote the beautiful language 
                  of physics in all of its true glory. Our mission is to bridge the gap between 
                  complex physics concepts and everyday understanding.
                </p>
                <p>
                  Based at BITS Pilani, we provide quality content through our blog, engaging 
                  Instagram posts, and interactive events that explain fascinating physics 
                  phenomena in an accessible way.
                </p>
                <p>
                  Whether you&apos;re interested in quantum computing, cosmology, particle 
                  physics, or any other field — we have something for you.
                </p>
              </div>

              <div className="mt-12">
                <Link 
                  href="/about" 
                  className="text-sm font-semibold uppercase tracking-[0.15em] text-text hover:text-accent transition-colors"
                >
                  Learn More ➔
                </Link>
              </div>
            </div>

            {/* Right: Image */}
            <div className="relative w-full h-[600px]">
              <Image
                src="https://raw.githubusercontent.com/bitsphyassoc/bitsphyassoc.github.io/main/assets/images/feature-image.jpg"
                alt="Einstein figure"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Blended XKCD Comic ── */}
      <XkcdStrip
        comic={XKCD_COMICS.purity}
        maxWidth="max-w-2xl"
        className="py-12"
      />

      {/* ── Featured Articles ── */}
      <section 
        className="py-24 border-t" 
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-[1400px] mx-auto px-5 md:px-8">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-16">
            <div className="flex items-center gap-4">
              <span className="text-2xl uppercase tracking-[0.2em] text-accent font-yanone">
                Latest
              </span>
              <div className="w-12 h-px bg-border" />
              <h2 className="text-4xl text-text font-medium font-display">
                Featured Articles
              </h2>
            </div>
            
            <Link
              href="/blog"
              className="text-sm font-semibold uppercase tracking-[0.15em] text-text hover:text-accent transition-colors"
            >
              All Articles ➔
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {featuredArticles.length > 0 ? (
              featuredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  title={article.title}
                  description={article.excerpt}
                  author={article.author}
                  image={article.cover_image}
                  slug={article.slug}
                />
              ))
            ) : (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse border rounded-xl p-6"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                >
                  <div className="h-44 bg-prussian/20 rounded-lg mb-4" />
                  <div className="h-6 bg-prussian/20 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-prussian/20 rounded w-full mb-2" />
                  <div className="h-4 bg-prussian/20 rounded w-2/3" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}
