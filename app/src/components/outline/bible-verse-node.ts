import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { BibleVerseComponent } from "./bible-verse-component";

export interface BibleVerseOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    bibleVerse: {
      /**
       * Insert a bible verse reference node.
       * verseEnd é opcional — quando presente, representa um intervalo (ex: 7 a 9).
       */
      insertBibleVerse: (options: {
        book: number;
        chapter: number;
        verse: number;
        verseEnd?: number | null;
        text: string;
      }) => ReturnType;
    };
  }
}

export const BibleVerse = Node.create<BibleVerseOptions>({
  name: "bibleVerse",

  group: "inline",
  inline: true,
  selectable: true,
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: "bible-verse-chip",
      },
    };
  },

  addAttributes() {
    return {
      book: { default: null },
      chapter: { default: null },
      verse: { default: null },
      // NOVO: fim do intervalo, quando o usuário selecionou um range (ex: "7-9")
      verseEnd: { default: null },
      text: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="bible-verse"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-type": "bible-verse" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BibleVerseComponent);
  },

  addCommands() {
    return {
      insertBibleVerse:
        (options) =>
          ({ commands }) => {
            return commands.insertContent({
              type: this.name,
              attrs: {
                book: options.book,
                chapter: options.chapter,
                verse: options.verse,
                verseEnd: options.verseEnd ?? null,
                text: options.text,
              },
            });
          },
    };
  },
});