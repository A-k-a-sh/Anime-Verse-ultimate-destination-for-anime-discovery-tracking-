import { useState, useEffect, useRef } from 'react';
import {
  PhotoIcon,
  ExclamationTriangleIcon,
  VideoCameraIcon,
  ChatBubbleBottomCenterTextIcon,
  ListBulletIcon,
  NumberedListIcon,
  MinusIcon,
  H1Icon,
  H2Icon
} from '@heroicons/react/24/outline';

const COMMANDS = [
  {
    id: 'image',
    title: 'Image',
    desc: 'Upload screenshot or artwork via Cloudinary',
    icon: PhotoIcon,
    color: 'text-emerald-400',
    action: (editor, { openImageUpload }) => {
      openImageUpload?.();
    }
  },
  {
    id: 'spoiler',
    title: 'Spoiler Block',
    desc: 'Mask text with click-to-reveal spoiler blur',
    icon: ExclamationTriangleIcon,
    color: 'text-amber-400',
    action: (editor) => {
      editor.chain().focus().toggleSpoiler().run();
    }
  },
  {
    id: 'youtube',
    title: 'YouTube Video',
    desc: 'Embed anime OST, AMV, or official trailer',
    icon: VideoCameraIcon,
    color: 'text-rose-400',
    action: (editor, { openYoutubeModal }) => {
      openYoutubeModal?.();
    }
  },
  {
    id: 'h1',
    title: 'Heading 1',
    desc: 'Large major section title',
    icon: H1Icon,
    color: 'text-primary',
    action: (editor) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    }
  },
  {
    id: 'h2',
    title: 'Heading 2',
    desc: 'Medium section subtitle',
    icon: H2Icon,
    color: 'text-secondary',
    action: (editor) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    }
  },
  {
    id: 'quote',
    title: 'Blockquote',
    desc: 'Highlighted dialogue or quote',
    icon: ChatBubbleBottomCenterTextIcon,
    color: 'text-purple-400',
    action: (editor) => {
      editor.chain().focus().toggleBlockquote().run();
    }
  },
  {
    id: 'bullet-list',
    title: 'Bullet List',
    desc: 'Unordered theory or key takeaway points',
    icon: ListBulletIcon,
    color: 'text-blue-400',
    action: (editor) => {
      editor.chain().focus().toggleBulletList().run();
    }
  },
  {
    id: 'numbered-list',
    title: 'Numbered List',
    desc: 'Ordered steps, rankings, or tiers',
    icon: NumberedListIcon,
    color: 'text-indigo-400',
    action: (editor) => {
      editor.chain().focus().toggleOrderedList().run();
    }
  },
  {
    id: 'divider',
    title: 'Divider',
    desc: 'Clean horizontal visual section break',
    icon: MinusIcon,
    color: 'text-gray-400',
    action: (editor) => {
      editor.chain().focus().setHorizontalRule().run();
    }
  }
];

const SlashCommandMenu = ({ editor, openImageUpload, openYoutubeModal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const { selection } = editor.state;
      const { $from } = selection;

      // Get text of current block up to cursor
      const textBefore = $from.parent.textBetween(0, $from.parentOffset, null, '\ufffc');

      // Check if line matches slash trigger
      const match = textBefore.match(/^\/([a-zA-Z0-9_-]*)$/);
      if (match) {
        setQuery(match[1].toLowerCase());
        setIsOpen(true);
        setSelectedIndex(0);
      } else {
        setIsOpen(false);
      }
    };

    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
    };
  }, [editor]);

  const filteredCommands = COMMANDS.filter(cmd =>
    cmd.title.toLowerCase().includes(query) || cmd.desc.toLowerCase().includes(query)
  );

  const executeCommand = (cmd) => {
    if (!editor || !cmd) return;

    // Remove the leading slash typed by the user
    const { selection } = editor.state;
    const { $from } = selection;
    const slashPos = $from.pos - (query.length + 1);

    editor.chain().focus().deleteRange({ from: slashPos, to: $from.pos }).run();
    cmd.action(editor, { openImageUpload, openYoutubeModal });
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  if (!isOpen || filteredCommands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-40 bg-dark-200/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-2 w-72 sm:w-80 shadow-[0_20px_50px_rgba(0,0,0,0.8)] max-h-80 overflow-y-auto"
      style={{
        // Positioned cleanly within editor view
        bottom: '2rem',
        right: '2rem'
      }}
    >
      <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 border-b border-white/10 mb-1 flex items-center justify-between">
        <span>Quick Insert</span>
        <span className="text-[10px] text-gray-500 font-normal">↑↓ arrows • Enter</span>
      </div>
      <div className="space-y-0.5">
        {filteredCommands.map((cmd, idx) => {
          const Icon = cmd.icon;
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={cmd.id}
              type="button"
              onClick={() => executeCommand(cmd)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-100 ${
                isSelected
                  ? 'bg-white/10 text-white shadow-inner'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className={`p-2 rounded-lg bg-dark-100 border border-white/10 ${cmd.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{cmd.title}</div>
                <div className="text-xs text-gray-400 truncate">{cmd.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SlashCommandMenu;
