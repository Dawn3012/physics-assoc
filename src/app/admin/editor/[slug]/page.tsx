'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Article } from '@/lib/types';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  looksLikeLatexDocument,
  convertLatexToMarkdown,
  countImagePlaceholders,
  IMAGE_PLACEHOLDER,
} from '@/lib/latexToMarkdown';
import { uploadArticleImage, imageFilesFrom } from '@/lib/uploadImage';
import ImageUploader from '@/components/ImageUploader';
import toast from 'react-hot-toast';

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const articleSlug = params.slug as string;

  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [articleId, setArticleId] = useState('');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [author, setAuthor] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [published, setPublished] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const contentRef = useRef<HTMLTextAreaElement>(null);

  // An uploaded image fills the next figure placeholder a LaTeX paste left
  // behind, so converting a .tex and then uploading its figures in order just
  // works. Once none are left, the image lands at the cursor instead.
  function insertImageMarkdown(url: string) {
    setContent((current) => {
      if (current.includes(IMAGE_PLACEHOLDER)) {
        return current.replace(IMAGE_PLACEHOLDER, () => url);
      }
      const at = contentRef.current?.selectionStart ?? current.length;
      return current.slice(0, at) + `\n\n![](${url})\n\n` + current.slice(at);
    });
  }

  async function uploadImages(files: File[]) {
    for (const file of files) {
      try {
        insertImageMarkdown(await uploadArticleImage(file));
        toast.success(`Uploaded ${file.name}`);
      } catch (err: any) {
        toast.error(err?.message ?? 'Upload failed');
      }
    }
  }

  function handleContentPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    // A screenshot on the clipboard goes straight to storage — no repo commit,
    // no manual URL.
    const images = imageFilesFrom(e.clipboardData.items);
    if (images.length) {
      e.preventDefault();
      void uploadImages(images);
      return;
    }

    const pasted = e.clipboardData.getData('text');
    if (looksLikeLatexDocument(pasted)) {
      e.preventDefault();
      const converted = convertLatexToMarkdown(pasted);
      setContent(converted);
      const missing = countImagePlaceholders(converted);
      toast.success(
        missing
          ? `Converted LaTeX — ${missing} figure${missing > 1 ? 's' : ''} still need an image, upload them in order`
          : 'Detected LaTeX — converted to Markdown automatically'
      );
    }
  }

  function handleContentDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    const images = imageFilesFrom(e.dataTransfer.files);
    if (!images.length) return;
    e.preventDefault();
    void uploadImages(images);
  }

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/admin');
      return;
    }
    setAuthenticated(true);
    fetchArticle();
  }

  async function fetchArticle() {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', articleSlug)
      .single();

    if (error || !data) {
      toast.error('Article not found');
      router.push('/admin');
      return;
    }

    const article = data as Article;
    setArticleId(article.id);
    setTitle(article.title);
    setSlug(article.slug);
    setExcerpt(article.excerpt);
    setContent(article.content);
    setCoverImage(article.cover_image);
    setAuthor(article.author);
    setTagsInput(article.tags?.join(', ') || '');
    setPublished(article.published);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!title || !slug || !content) {
      toast.error('Title, slug, and content are required');
      return;
    }

    setSaving(true);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const { error } = await supabase
      .from('articles')
      .update({
        title,
        slug,
        excerpt,
        content,
        cover_image: coverImage,
        author,
        tags,
        published,
      })
      .eq('id', articleId);

    if (error) {
      toast.error('Failed to update article: ' + error.message);
      setSaving(false);
      return;
    }

    toast.success('Article updated!');
    router.push('/admin');
  }

  if (!authenticated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-prussian border-t-orange rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen pt-8 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
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
              <h1 className="text-3xl font-bold text-white">Edit Article</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                  showPreview
                    ? 'bg-orange text-white'
                    : 'bg-prussian/40 text-gray-300 border border-prussian/50 hover:border-orange/30'
                }`}
              >
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
          </div>

          {showPreview ? (
            /* Full Website Draft Preview */
            <div className="space-y-6">
              <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-4 py-3 rounded-xl flex items-center justify-between text-sm">
                <span>👁️ <strong>Draft Preview:</strong> This is how your article will appear on the website once published.</span>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="px-3 py-1 bg-amber-500 text-black font-semibold rounded text-xs hover:bg-amber-400 transition-colors"
                >
                  Return to Edit
                </button>
              </div>

              <div className="rounded-2xl border p-6 md:p-10" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                <header className="max-w-[1000px] mx-auto text-center mb-10">
                  {tagsInput && (
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      {tagsInput.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                        <span key={tag} className="text-base font-yanone uppercase tracking-widest px-2.5 py-0.5 rounded border border-border text-text-dim">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h1 className="text-3xl md:text-5xl text-text font-display mb-4 leading-tight">
                    {title || 'Untitled Article'}
                  </h1>
                  <p className="text-lg uppercase tracking-wider font-yanone text-text-dim">
                    By <span className="text-accent font-semibold">{author || 'Author Name'}</span> • {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </header>

                {coverImage && (
                  <div className="max-w-[1000px] mx-auto mb-10 rounded-lg overflow-hidden border border-border aspect-[21/9] relative bg-black/40">
                    <img src={coverImage} alt={title} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="max-w-[1000px] mx-auto p-6 md:p-10 border rounded-lg bg-bg-surface text-text leading-relaxed prose dark:prose-invert" style={{ borderColor: 'var(--border)' }}>
                  <MarkdownRenderer content={content || '*No content written yet.*'} />
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="bg-prussian/20 backdrop-blur-sm rounded-2xl p-8 border border-prussian/50 space-y-6">
                {/* Title */}
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
                    className="w-full px-4 py-3 bg-black/50 border border-prussian rounded-lg text-white text-xl font-semibold placeholder-gray-600 focus:outline-none focus:border-orange/50 transition-colors"
                    placeholder="Your article title"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-400 mb-2">
                    Slug <span className="text-gray-600">(not editable — changing it would break existing links)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm">/blog/</span>
                    <input
                      id="slug"
                      type="text"
                      value={slug}
                      readOnly
                      required
                      className="flex-1 px-4 py-3 bg-black/30 border border-prussian rounded-lg text-gray-400 cursor-not-allowed font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Author */}
                  <div>
                    <label htmlFor="author" className="block text-sm font-medium text-gray-400 mb-2">
                      Author
                    </label>
                    <input
                      id="author"
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full px-4 py-3 bg-black/50 border border-prussian rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange/50 transition-colors"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-400 mb-2">
                      Tags <span className="text-gray-600">(comma-separated)</span>
                    </label>
                    <input
                      id="tags"
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      className="w-full px-4 py-3 bg-black/50 border border-prussian rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Cover Image URL */}
                <div>
                  <label htmlFor="cover" className="block text-sm font-medium text-gray-400 mb-2">
                    Cover Image
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    id="cover"
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-prussian rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange/50 transition-colors"
                    placeholder="Upload a file, or paste an image URL"
                  />
                  <ImageUploader onUploaded={setCoverImage} label="Upload cover" className="shrink-0" />
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <label htmlFor="excerpt" className="block text-sm font-medium text-gray-400 mb-2">
                    Excerpt
                  </label>
                  <textarea
                    id="excerpt"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-black/50 border border-prussian rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange/50 transition-colors resize-none"
                  />
                </div>

                {/* Content */}
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-400 mb-2">
                    Content * <span className="text-gray-600">(Markdown + LaTeX supported: $inline$ or $$block$$ — or paste a full .tex article and it auto-converts)</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <ImageUploader onUploaded={insertImageMarkdown} label="Insert image" multiple />
                    <span className="text-xs text-gray-600">
                      Images upload to storage — you can also paste or drop them straight into the box.
                    </span>
                  </div>
                  <textarea
                    id="content"
                    ref={contentRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onPaste={handleContentPaste}
                    onDrop={handleContentDrop}
                    onDragOver={(e) => e.preventDefault()}
                    required
                    rows={20}
                    className="w-full px-4 py-3 bg-black/50 border border-prussian rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange/50 transition-colors font-mono text-sm resize-y"
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
                    {published ? 'Published' : 'Draft'}
                  </span>
                </label>

                <div className="flex gap-3">
                  <Link
                    href="/admin"
                    className="py-2.5 px-6 rounded-lg font-medium text-gray-300 bg-prussian/40 hover:bg-prussian/60 border border-prussian/50 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-orange hover:bg-orange/80 disabled:bg-orange/40 text-white font-bold py-2.5 px-8 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Update Article'
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
