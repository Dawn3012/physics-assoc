'use client';

import React from 'react';
import Link from 'next/link';
import { EventItem } from '@/lib/types';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaExternalLinkAlt, FaArrowRight } from 'react-icons/fa';

interface EventCardProps {
  event: EventItem;
}

export default function EventCard({ event }: EventCardProps) {
  const isUpcoming = event.status === 'upcoming';
  const isPast = event.status === 'past';

  // Format date nicely
  let formattedDate = event.date;
  try {
    const d = new Date(event.date);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  } catch {
    // keep raw string if invalid
  }

  const defaultImage =
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80';

  return (
    <article
      className="border bg-bg-surface hover:border-accent transition-all duration-300 flex flex-col overflow-hidden group rounded-sm"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Event Banner / Poster */}
      <Link
        href={`/events/${event.slug}`}
        className="block relative h-52 md:h-60 overflow-hidden bg-bg"
      >
        <img
          src={event.image_url || defaultImage}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Status Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {isUpcoming ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-emerald-500/90 text-white backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              Upcoming
            </span>
          ) : isPast ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-black/60 text-gray-200 backdrop-blur-md border border-white/20">
              Conducted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-amber-500/90 text-white backdrop-blur-md">
              Ongoing
            </span>
          )}
        </div>

        {/* Category Pill */}
        {event.category && (
          <div className="absolute top-4 right-4">
            <span
              className="text-xs font-yanone uppercase tracking-widest px-2.5 py-1 backdrop-blur-md border rounded text-text"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border)',
              }}
            >
              {event.category}
            </span>
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div className="p-6 md:p-7 flex flex-col flex-1 justify-between gap-5">
        <div>
          {/* Date, Time & Location Meta */}
          <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs md:text-sm text-text-dim mb-3">
            <div className="flex items-center gap-1.5">
              <FaCalendarAlt className="text-accent shrink-0" />
              <span className="font-medium text-text">{formattedDate}</span>
            </div>
            {event.time && (
              <div className="flex items-center gap-1.5">
                <FaClock className="text-accent shrink-0" />
                <span>{event.time}</span>
              </div>
            )}
          </div>

          {/* Location ("Where") */}
          {event.location && (
            <div className="flex items-center gap-1.5 text-xs md:text-sm text-text-dim mb-4">
              <FaMapMarkerAlt className="text-accent2 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-display font-medium text-text group-hover:text-accent transition-colors line-clamp-2 mb-3">
            <Link href={`/events/${event.slug}`}>{event.title}</Link>
          </h2>

          {/* Description ("What") */}
          <p className="text-sm md:text-base text-text-dim leading-relaxed line-clamp-3">
            {event.description}
          </p>
        </div>

        {/* Footer Actions */}
        <div
          className="pt-4 border-t flex flex-wrap items-center justify-between gap-3"
          style={{ borderColor: 'var(--rule)' }}
        >
          <Link
            href={`/events/${event.slug}`}
            className="text-xs uppercase tracking-wider font-semibold text-text hover:text-accent transition-colors inline-flex items-center gap-1.5"
          >
            Details <FaArrowRight className="text-[10px]" />
          </Link>

          {isUpcoming && event.registration_url && (
            <a
              href={event.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs uppercase tracking-wider font-semibold px-3.5 py-1.5 rounded transition-all bg-accent hover:opacity-90 text-white inline-flex items-center gap-1.5 shadow-sm"
            >
              Register Now <FaExternalLinkAlt className="text-[10px]" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
