'use client';

import React from 'react';
import { socialLinks, navigationLinks } from '@/constants';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-[1400px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 py-16">
          <div className="md:col-span-5">
            <h3 className="text-4xl font-yanone mb-4" style={{ color: 'var(--text)' }}>
              Physics Association
            </h3>
            <p className="text-text-dim mt-2 leading-relaxed max-w-sm">
              Promoting the beautiful language of physics at BITS Pilani.
              A community of passionate students exploring the universe.
            </p>
          </div>
          <div className="md:col-span-3 md:col-start-7">
            <p className="text-2xl uppercase tracking-wider font-yanone text-text mb-4">Navigate</p>
            <ul className="space-y-3">
              {navigationLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-text-dim hover:text-accent transition-colors text-sm">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-3">
            <p className="text-2xl uppercase tracking-wider font-yanone text-text mb-4">Connect</p>
            <div className="flex flex-wrap gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center text-xl transition-colors rounded border border-border text-text-dim hover:text-accent hover:border-accent bg-transparent">
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
        <div className="py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center text-sm text-text-muted border-t" style={{ borderColor: 'var(--rule)' }}>
          <p>© {currentYear} Physics Association, BITS Pilani. All rights reserved.</p>
          <p>Designed with <span style={{ color: 'var(--accent3)' }}>♥</span> for science.</p>
        </div>
      </div>
    </footer>
  );
}
