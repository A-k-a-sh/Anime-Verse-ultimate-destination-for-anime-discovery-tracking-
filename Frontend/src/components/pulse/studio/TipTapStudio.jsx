import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';
import SpoilerMark from './extensions/SpoilerMark';
import StickyToolbar from './StickyToolbar';
import EditorBubbleMenu from './BubbleMenu';
import SlashCommandMenu from './SlashCommandMenu';
import { useEffect, useRef } from 'react';

const TipTapStudio = ({
  content = '',
  onChange,
  onImageUpload,
  isUploadingImage = false,
  placeholder = 'Feel the Fandom. Write your theory, review, or lore breakdown... (Type / for quick insert)'
}) => {
  const hiddenFileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        link: false // StarterKit v3 includes link by default; disable to prevent duplicate extension warning
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-2xl border border-white/10 max-w-full my-4 shadow-xl'
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary hover:text-primary-400 underline font-medium'
        }
      }),
      Placeholder.configure({
        placeholder
      }),
      Youtube.configure({
        nocookie: true,
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'rounded-2xl border border-white/10 my-4 shadow-xl overflow-hidden aspect-video max-w-full'
        }
      }),
      SpoilerMark
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[350px] sm:min-h-[450px] text-gray-200 text-base sm:text-lg leading-relaxed'
      }
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    }
  });

  // Sync external content update (e.g. when loading draft or existing pulse in edit mode)
  useEffect(() => {
    if (editor && content && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  const handleOpenImageUpload = () => {
    hiddenFileInputRef.current?.click();
  };

  const handleUploadAndInsert = async (file) => {
    if (!file || !editor) return;
    try {
      if (onImageUpload) {
        const url = await onImageUpload(file);
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      }
    } catch (err) {
      console.error('Failed to upload/insert image into editor:', err);
    }
  };

  const handleHiddenFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleUploadAndInsert(file);
    }
    e.target.value = '';
  };

  return (
    <div className="relative w-full rounded-2xl bg-dark-200/50 border border-white/10 p-3 sm:p-6 transition-all duration-300 focus-within:border-white/20 focus-within:shadow-[0_0_40px_rgba(255,107,107,0.1)]">
      {/* Sticky Top Toolbar */}
      <StickyToolbar
        editor={editor}
        onImageUpload={handleUploadAndInsert}
        isUploadingImage={isUploadingImage}
      />

      {/* Floating Selection Bubble Menu */}
      <EditorBubbleMenu editor={editor} />

      {/* Slash '/' Command Quick Menu */}
      <SlashCommandMenu
        editor={editor}
        openImageUpload={handleOpenImageUpload}
        openYoutubeModal={() => {
          const url = window.prompt('Enter YouTube URL:');
          if (url && editor) {
            editor.commands.setYoutubeVideo({ src: url });
          }
        }}
      />

      {/* Hidden file input for slash command image upload trigger */}
      <input
        type="file"
        ref={hiddenFileInputRef}
        onChange={handleHiddenFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* TipTap ProseMirror Editable Content Area */}
      <div className="px-1 sm:px-2 py-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TipTapStudio;
