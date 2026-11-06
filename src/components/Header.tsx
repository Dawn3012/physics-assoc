'use client';

import React, { useState, useEffect } from 'react';
import { socialLinks, navigationLinks } from '@/constants';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'var(--bg-surface)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      }}
    >
      <nav className="max-w-[1600px] mx-auto px-5 md:px-8">
        <div className="flex items-center justify-between h-24">

          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-3 group w-1/4">
            <img
              src="https://res.cloudinary.com/daelpfpju/image/upload/v1787506045/physics-assoc_logo_lrnotx.jpg"
              alt="Club Logo"
              width={56}
              height={56}
              loading="eager"
              decoding="async"
              className="w-14 h-14 object-contain rounded-full"
            />
            <div className="flex items-baseline gap-2">
              <span
                className="text-3xl md:text-5xl tracking-wide transition-colors group-hover:text-accent font-yanone"
              >
                Physics
              </span>
              <span
                className="text-[0.65rem] md:text-xs font-sans uppercase tracking-[0.2em] text-text-muted font-semibold"
              >
                Association
              </span>
            </div>
          </Link>

          {/* Center: Desktop nav */}
          <div className="hidden md:flex flex-1 justify-center items-center gap-6">
            {navigationLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="nav-link"
                data-active={isActive(link.href) ? 'true' : undefined}
                {...(link.href.startsWith('http')
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right: Social & Controls */}
          <div className="hidden md:flex w-1/4 justify-end items-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-text transition-colors"
                  style={{ fontSize: '1.1rem' }}
                  aria-label={social.name}
                >
                  <Icon />
                </a>
              );
            })}

            <div className="rule-v h-6 mx-2" />
            <ThemeToggle />
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center justify-end w-1/4 gap-4">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="flex items-center justify-center text-text-dim hover:text-accent transition-colors"
              style={{ fontSize: '1.5rem' }}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-b"
          style={{
            background: 'var(--bg-surface)',
            backdropFilter: 'blur(12px)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="px-5 py-6 flex flex-col gap-2">
            {navigationLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="py-3 text-sm font-semibold uppercase tracking-widest border-b border-border/50"
                style={{
                  color: isActive(link.href) ? 'var(--accent)' : 'var(--text)',
                }}
                {...(link.href.startsWith('http')
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="px-5 pb-8 pt-2 flex items-center gap-6">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-dim hover:text-accent transition-colors"
                  style={{ fontSize: '1.5rem' }}
                  aria-label={social.name}
                >
                  <Icon />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
