import { Mark, mergeAttributes } from '@tiptap/core';

export const SpoilerMark = Mark.create({
  name: 'spoiler',
  inclusive: false,

  parseHTML() {
    return [
      {
        tag: 'span[data-spoiler]',
      },
      {
        tag: 'span.anime-spoiler-blur',
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-spoiler': 'true',
        class: 'anime-spoiler-blur cursor-pointer select-none',
        title: 'Click to reveal spoiler',
      }),
      0
    ];
  },

  addCommands() {
    return {
      toggleSpoiler: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
      setSpoiler: () => ({ commands }) => {
        return commands.setMark(this.name);
      },
      unsetSpoiler: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      }
    };
  }
});

export default SpoilerMark;
