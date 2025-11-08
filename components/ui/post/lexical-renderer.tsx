"use client";

import React, { useEffect } from "react";
import {
  LexicalComposer,
  InitialConfigType,
} from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";

/* ----------------------------------------------------------
 * Optional Image Node Stub
 * ---------------------------------------------------------- */
/*class ImageNode extends HeadingNode {
  static getType() {
    return "image";
  }
  static clone(node: ImageNode) {
    return new ImageNode(node.__key);
  }
}
*/
/* ----------------------------------------------------------
 * Editor Config (Read-only)
 * ---------------------------------------------------------- */

const editorConfig: InitialConfigType = {
  namespace: "PublicPostRenderer",
  nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode],
  editable: false,
  theme: {
    paragraph: "mb-5 text-lg leading-relaxed",
    heading: {
      h1: "text-4xl font-extrabold my-6",
      h2: "text-3xl font-bold my-5",
      h3: "text-2xl font-semibold my-4",
    },
    list: {
      ul: "list-disc pl-8 my-4 space-y-2",
      ol: "list-decimal pl-8 my-4 space-y-2",
      listitem: "mb-1",
    },
    quote:
      "border-l-4 border-indigo-500 pl-6 py-2 italic text-xl text-gray-600 dark:text-gray-400 my-6",
    link: "text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800",
  },
  onError: (error) => console.error("Lexical Render Error:", error),
};

/* ----------------------------------------------------------
 * InitialContentPlugin
 * ---------------------------------------------------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const InitialContentPlugin = ({ richContent }: { richContent: any }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!richContent) return;

    try {
      const editorState = editor.parseEditorState(richContent);
      editor.setEditorState(editorState);
    } catch (e) {
      console.error("Failed to parse Lexical JSON:", e);
      editor.update(() => $getRoot().clear());
    }
  }, [editor, richContent]);

  return null;
};

/* ----------------------------------------------------------
 * Renderer Component
 * ---------------------------------------------------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LexicalRenderer = ({ richContent }: { richContent: any }) => {
  if (!richContent) {
    return (
      <p className="text-center text-gray-500 italic">
        No content available for this post.
      </p>
    );
  }

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <InitialContentPlugin richContent={richContent} />
      <RichTextPlugin
        contentEditable={
          <ContentEditable className="relative p-0 min-h-[200px] outline-none" />
        }
        placeholder={
          <div className="absolute top-0 left-0 text-gray-400">
            Loading content...
          </div>
        }
        ErrorBoundary={() => <div>Error rendering rich content.</div>}
      />
      <HistoryPlugin />
    </LexicalComposer>
  );
};
