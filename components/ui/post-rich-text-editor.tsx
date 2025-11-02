"use client";

import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $getRoot, EditorState } from 'lexical';
import { PostEditorToolbar } from '.';

// Import the toolbar and placeholder styles (you'll need to define these styles)
// NOTE: I'm not including a toolbar for simplicity here, but that is the next logical step.

interface PostRichTextEditorProps {
    initialContent?: string; // Expects a JSON string of Lexical state
    onChange: (content: string) => void; // Sends back the JSON string
}

const editorConfig = {
  // Theme styling (you will need to create this CSS later)
  theme: {
    // Example: This is where you'd define classes for your content editable
    // placeholder: "editor-placeholder",
    // paragraph: "editor-paragraph"
  },
  onError(error: Error) {
    console.error("Lexical Editor Error:", error);
  },
  // Nodes: This is where you register custom nodes like ImageNode, TableNode, etc.
  nodes: [],
};


function EditorCapturePlugin({ onChange, initialContent }: PostRichTextEditorProps) {
    const initialEditorState = initialContent ? JSON.parse(initialContent) : null;

    function handleChange(editorState: EditorState) {
        editorState.read(() => {
            // Get the JSON state and pass it back to the form
            const jsonState = JSON.stringify(editorState.toJSON());
            onChange(jsonState);
        });
    }

    return (
        <OnChangePlugin onChange={handleChange} />
    );
}

export function PostRichTextEditor({ initialContent, onChange }: PostRichTextEditorProps) {
    // A simple placeholder component
    const Placeholder = () => (
        <div className="absolute top-3 left-3 text-gray-500 pointer-events-none">
            Contenu de la publication...
        </div>
    );
    
    // We need to provide the initial state to LexicalComposer
    const initialConfig = {
        namespace: "post-editor",
        ...editorConfig,
        editorState: initialContent
    };

    return (
        <LexicalComposer initialConfig={initialConfig}>
            {/* 1. Add the Toolbar component */}
            <PostEditorToolbar />
            <div className="relative border border-gray-300 rounded-md p-2 min-h-[300px]">
                {/* 1. Rich Text Plugin for the core editing area */}
                <RichTextPlugin
                    contentEditable={<ContentEditable className="outline-none min-h-[300px] p-2" />}
                    placeholder={<Placeholder />}
                    ErrorBoundary={LexicalErrorBoundary}
                />

                {/* 2. Capture changes and send them to the parent form */}
                <EditorCapturePlugin initialContent={initialContent} onChange={onChange} />
                
                {/* 3. Standard plugins for history (undo/redo) */}
                <HistoryPlugin />
                
                {/* 4. You would add a ToolbarPlugin here later */}
            </div>
        </LexicalComposer>
    );
}