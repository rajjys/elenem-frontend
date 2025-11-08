"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  SELECTION_CHANGE_COMMAND,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  $createParagraphNode,
  TextFormatType,
  EditorThemeClasses,
  EditorState,
  SerializedEditorState,
} from "lexical";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
} from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, HeadingNode, QuoteNode } from "@lexical/rich-text";
import { UNDO_COMMAND, REDO_COMMAND } from "lexical";
import { Bold, Italic, Underline, List, ListOrdered, Code, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const lexicalTheme: EditorThemeClasses = {
  paragraph: "text-sm leading-6",
  quote: "border-l-2 pl-4 italic text-gray-600",
  heading: {
    h1: "text-2xl font-bold",
    h2: "text-xl font-semibold",
    h3: "text-lg font-medium",
  },
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    code: "font-mono text-sm bg-gray-100 px-1 rounded",
  },
  list: {
    ul: "list-disc ml-6",
    ol: "list-decimal ml-6",
    listitem: "my-1",
  },
};

// ---------------------------
// Toolbar
// ---------------------------
function PostEditorToolbar() {
  const [editor] = useLexicalComposerContext();
  const [formats, setFormats] = useState<{ bold: boolean; italic: boolean; underline: boolean; code: boolean }>({
    bold: false,
    italic: false,
    underline: false,
    code: false,
  });
  const [blockType, setBlockType] = useState("paragraph");

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    setFormats({
      bold: selection.hasFormat("bold"),
      italic: selection.hasFormat("italic"),
      underline: selection.hasFormat("underline"),
      code: selection.hasFormat("code"),
    });

    const anchorNode = selection.anchor.getNode();
    const parent = anchorNode.getParent();
    setBlockType(parent?.getType?.() ?? "paragraph");
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, updateToolbar]);

  const format = (type: TextFormatType) => editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
const changeBlock = useCallback(
  (type: string) => {
    if (type === "ul") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      return;
    }

    if (type === "ol") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      return;
    }

    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getTopLevelElementOrThrow();

      if (type === "paragraph") {
        if (element.getType() !== "paragraph") {
          const paragraphNode = $createParagraphNode();
          paragraphNode.append(...element.getChildren());
          element.replace(paragraphNode);
        }
      } else if (["h1", "h2", "h3"].includes(type)) {
        if (!$isHeadingNode(element) || element.getTag() !== type) {
          const headingNode = $createHeadingNode(type as "h1" | "h2" | "h3");
          headingNode.append(...element.getChildren());
          element.replace(headingNode);
        }
      } else if (type === "quote") {
        const quoteNode = $createQuoteNode();
        quoteNode.append(...element.getChildren());
        element.replace(quoteNode);
      }
    });
  },
  [editor]
);



  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 py-2 px-3 sticky top-0 bg-white z-20">
      <div className="flex gap-1">
        <Button variant={formats.bold ? "secondary" : "ghost"} size="sm" onClick={() => format("bold")}><Bold className="h-3 w-3" /></Button>
        <Button variant={formats.italic ? "secondary" : "ghost"} size="sm" onClick={() => format("italic")}><Italic className="h-3 w-3" /></Button>
        <Button variant={formats.underline ? "secondary" : "ghost"} size="sm" onClick={() => format("underline")}><Underline className="h-3 w-3" /></Button>
        <Button variant={formats.code ? "secondary" : "ghost"} size="sm" onClick={() => format("code")}><Code className="h-3 w-3" /></Button>
      </div>

      <div className="h-6 w-px bg-gray-200 mx-2" />

      <Button variant="ghost" size="sm" onClick={() => changeBlock("ul")}><List className="h-3 w-3" /></Button>
      <Button variant="ghost" size="sm" onClick={() => changeBlock("ol")}><ListOrdered className="h-3 w-3" /></Button>

      <div className="h-6 w-px bg-gray-200 mx-2" />

      <Select value={blockType} onValueChange={(v) => changeBlock(v)}>
        <SelectTrigger className="w-28 h-8 text-xs">
          <SelectValue placeholder="Paragraph" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">Normal</SelectItem>
          <SelectItem value="h1">Heading 1</SelectItem>
          <SelectItem value="h2">Heading 2</SelectItem>
          <SelectItem value="h3">Heading 3</SelectItem>
          <SelectItem value="quote">Quote</SelectItem>
        </SelectContent>
      </Select>

      <div className="ml-auto flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}><ArrowLeft className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}><ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

// ---------------------------
// Main Editor
// ---------------------------
function EditorInitPlugin({ initialContent }: { initialContent?: string }) {
  const [editor] = useLexicalComposerContext();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialContent || initialized) return;
    try {
      const parsed = JSON.parse(initialContent) as SerializedEditorState;
      const state = editor.parseEditorState(parsed);
      editor.setEditorState(state);
      setInitialized(true);
    } catch (e) {
      console.error("Failed to initialize editor state:", e);
    }
  }, [editor, initialContent, initialized]);

  return null;
}


interface PostRichTextEditorProps {
  initialContent?: string;
  onChange: (json: string) => void;
}

export default function PostRichTextEditor({
  initialContent,
  onChange,
}: PostRichTextEditorProps) {
  const initialConfig: InitialConfigType = useMemo(
      () => ({
        namespace: "post-editor",
        theme: lexicalTheme,
        onError(error) {
          console.error("Lexical Error:", error);
        },
        
        nodes: [
          LinkNode,
          ListNode,
          ListItemNode,
          HeadingNode,
          QuoteNode,
        ]
      }),
      []
    );

  const handleChange = useCallback(
    (editorState: EditorState | SerializedEditorState) => {
      try {
        const json = JSON.stringify(
          (editorState as EditorState).toJSON?.() ??
            (editorState as SerializedEditorState)
        );
        onChange(json);
      } catch (e) {
        console.error(e);
      }
    },
    [onChange]
  );

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="border border-slate-200 rounded-md bg-white">
        <PostEditorToolbar />
        <div className="relative p-4 min-h-[320px]">
          <RichTextPlugin
            contentEditable={
                <ContentEditable className="prose prose-sm max-w-full focus:outline-none min-h-[220px]" />
            }
            placeholder={
                <div className="absolute top-4 left-4 text-gray-400 select-none pointer-events-none">
                Contenu de la publication...
                </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
            />
          {initialContent && <EditorInitPlugin initialContent={initialContent} />}
          <LinkPlugin />
          <ListPlugin />
          <OnChangePlugin onChange={handleChange} />
          <HistoryPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
}
