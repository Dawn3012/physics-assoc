export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  author: string;
  tags: string[];
  published: boolean;
  created_at: string;
  updated_at: string;
}

export type ArticleInsert = Omit<Article, 'id' | 'created_at' | 'updated_at'>;
export type ArticleUpdate = Partial<ArticleInsert>;

export interface Newsletter {
  id: string;
  title: string;
  slug: string;
  issue: string;
  description: string;
  file_path: string;
  file_url: string;
  file_size_bytes: number;
  original_size_bytes: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export type NewsletterInsert = Omit<Newsletter, 'id' | 'created_at' | 'updated_at'>;
export type NewsletterUpdate = Partial<NewsletterInsert>;

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image_url: string;
  category: string;
  status: 'upcoming' | 'past' | 'ongoing';
  registration_url: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export type EventInsert = Omit<EventItem, 'id' | 'created_at' | 'updated_at'>;
export type EventUpdate = Partial<EventInsert>;

