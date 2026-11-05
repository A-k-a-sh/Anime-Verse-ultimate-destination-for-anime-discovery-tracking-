import { useState, useEffect, useRef } from 'react';
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  LinkIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';

const StickyToolbar = ({ editor, onImageUpload, isUploadingImage = false }) => {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [, setTick] = useState(0);

  const fileInputRef = useRef(null);

  // Re-render toolbar synchronously on every transaction / mark toggle / selection change
  useEffect(() => {
    if (!editor) return;
    const update = () => setTick(t => t + 1);
    editor.on('transaction', update);
    editor.on('selectionUpdate', update);
    return () => {
      editor.off('transaction', update);
      editor.off('selectionUpdate', update);
    };
  }, [editor]);

  if (!editor) return null;

  const handleLinkSubmit = (e) => {
    e.preventDefault();
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      let finalUrl = linkUrl.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
    }
    setLinkUrl('');
    setShowLinkModal(false);
  };

  const handleYoutubeSubmit = (e) => {
    e.preventDefault();
    if (youtubeUrl.trim()) {
      editor.commands.setYoutubeVideo({ src: youtubeUrl.trim() });
    }
    setYoutubeUrl('');
    setShowYoutubeModal(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      await onImageUpload(file);
    }
    e.target.value = '';
  };

  const btnClass = (isActive, isDisabled = false) => `
    p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 flex items-center justify-center gap-1
    ${isDisabled ? 'opacity-40 cursor-not-allowed text-gray-500' : 'cursor-pointer'}
    ${isActive
      ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(255,107,107,0.25)]'
      : 'text-gray-300 hover:text-white hover:bg-white/10'
    }
  `;

  return (
    <div className="sticky top-16 sm:top-20 z-20 bg-dark-200/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 sm:p-2 mb-4 shadow-xl flex flex-wrap items-center gap-1">
      {/* History */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className={btnClass(false, !editor.can().undo())}
        title="Undo (Ctrl+Z)"
      >
        <ArrowUturnLeftIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className={btnClass(false, !editor.can().redo())}
        title="Redo (Ctrl+Y)"
      >
        <ArrowUturnRightIcon className="w-4 h-4" />
      </button>

      <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

      {/* Headings */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={btnClass(editor.isActive('heading', { level: 1 }))}
        title="Heading 1"
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btnClass(editor.isActive('heading', { level: 2 }))}
        title="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btnClass(editor.isActive('heading', { level: 3 }))}
        title="Heading 3"
      >
        H3
      </button>

      <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

      {/* Basic Marks */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive('bold'))}
        title="Bold (Ctrl+B)"
      >
        <span className="font-bold">B</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive('italic'))}
        title="Italic (Ctrl+I)"
      >
        <span className="italic font-serif">I</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btnClass(editor.isActive('strike'))}
        title="Strikethrough"
      >
        <span className="line-through">S</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={btnClass(editor.isActive('code'))}
        title="Inline Code"
      >
        <code>&lt;&gt;</code>
      </button>

      <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

      {/* Lists & Quotes */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive('bulletList'))}
        title="Bullet List"
      >
        • List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive('orderedList'))}
        title="Numbered List"
      >
        1. List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btnClass(editor.isActive('blockquote'))}
        title="Blockquote"
      >
        ❝ Quote
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={btnClass(editor.isActive('codeBlock'))}
        title="Code Block"
      >
        &#123; &#125;
      </button>

      <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

      {/* Anime Spoiler Mask */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleSpoiler().run()}
        className={btnClass(editor.isActive('spoiler'))}
        title="Mask as Anime Spoiler (Click-to-reveal)"
      >
        <ExclamationTriangleIcon className="w-4 h-4 text-amber-400 inline" />
        <span className="hidden sm:inline">Spoiler</span>
      </button>

      {/* Link */}
      <button
        type="button"
        onClick={() => {
          const prev = editor.getAttributes('link').href || '';
          setLinkUrl(prev);
          setShowLinkModal(true);
        }}
        className={btnClass(editor.isActive('link'))}
        title="Insert Link"
      >
        <LinkIcon className="w-4 h-4" />
      </button>

      {/* Media Upload */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploadingImage}
        className={btnClass(false, isUploadingImage)}
        title="Upload Image via Cloudinary"
      >
        <PhotoIcon className="w-4 h-4 text-emerald-400" />
        <span className="hidden sm:inline">{isUploadingImage ? 'Uploading...' : 'Image'}</span>
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* YouTube Embed */}
      <button
        type="button"
        onClick={() => setShowYoutubeModal(true)}
        className={btnClass(false)}
        title="Embed Anime OST / Trailer"
      >
        <VideoCameraIcon className="w-4 h-4 text-rose-400" />
        <span className="hidden sm:inline">YouTube</span>
      </button>

      {/* Link Dialog Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-dark-200 border border-white/15 rounded-2xl p-5 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-primary" />
              Add / Edit Hyperlink
            </h3>
            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl bg-dark-100 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-primary text-sm"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25"
                >
                  Apply Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* YouTube Dialog Modal */}
      {showYoutubeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-dark-200 border border-white/15 rounded-2xl p-5 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <VideoCameraIcon className="w-5 h-5 text-rose-400" />
              Embed YouTube Anime OST or Trailer
            </h3>
            <form onSubmit={handleYoutubeSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl bg-dark-100 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-rose-400 text-sm"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowYoutubeModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25"
                >
                  Embed Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StickyToolbar;
