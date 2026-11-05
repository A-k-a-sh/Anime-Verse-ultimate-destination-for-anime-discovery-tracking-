import { useState, useEffect } from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import {
  LinkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const EditorBubbleMenu = ({ editor }) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [, setTick] = useState(0);

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

  const handleApplyLink = (e) => {
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
    setShowLinkInput(false);
  };

  const btnClass = (isActive) => `
    p-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1
    ${isActive
      ? 'bg-primary/25 text-primary'
      : 'text-gray-300 hover:text-white hover:bg-white/10'
    }
  `;

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 150, zIndex: 30 }}
      shouldShow={({ state, from, to }) => {
        // Only show if text is selected
        return from !== to && !state.selection.node;
      }}
      className="bg-dark-200/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl p-1 flex items-center gap-1 text-white"
    >
      {showLinkInput ? (
        <form onSubmit={handleApplyLink} className="flex items-center gap-1 p-0.5">
          <input
            type="text"
            placeholder="https://..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            autoFocus
            className="px-2 py-1 bg-dark-100 border border-white/15 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary w-40"
          />
          <button
            type="submit"
            className="px-2 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            className="px-2 py-1 text-gray-400 text-xs font-medium hover:text-white"
          >
            ✕
          </button>
        </form>
      ) : (
        <>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={btnClass(editor.isActive('bold'))}
            title="Bold"
          >
            <span className="font-bold">B</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={btnClass(editor.isActive('italic'))}
            title="Italic"
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

          <div className="h-4 w-px bg-white/15 mx-0.5" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={btnClass(editor.isActive('heading', { level: 2 }))}
            title="H2 Subtitle"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={btnClass(editor.isActive('blockquote'))}
            title="Quote"
          >
            ❝
          </button>

          <div className="h-4 w-px bg-white/15 mx-0.5" />

          {/* Spoiler Mark */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSpoiler().run()}
            className={btnClass(editor.isActive('spoiler'))}
            title="Anime Spoiler Mask"
          >
            <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-400 inline" />
            <span className="text-[11px]">Spoiler</span>
          </button>

          {/* Link */}
          <button
            type="button"
            onClick={() => {
              setLinkUrl(editor.getAttributes('link').href || '');
              setShowLinkInput(true);
            }}
            className={btnClass(editor.isActive('link'))}
            title="Link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </BubbleMenu>
  );
};

export default EditorBubbleMenu;
