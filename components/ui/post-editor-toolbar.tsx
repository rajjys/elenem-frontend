"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    SELECTION_CHANGE_COMMAND,
    $getSelection,
    $isRangeSelection,
    FORMAT_TEXT_COMMAND,
    COMMAND_PRIORITY_CRITICAL,
    $isNodeSelection,
} from 'lexical';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $wrapNodes, $isAtNodeEnd } from '@lexical/selection';
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from '@lexical/list';
import { INSERT_IMAGE_COMMAND } from './ImageNode'; // We will define this custom command later
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from '@lexical/rich-text';
import { $set
    , $createParagraphNode,
} from 'lexical';

import { Bold, Italic, Link, Image as ImageIcon, List, ListOrdered, Quote, AlignLeft, AlignCenter, AlignRight, Code, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const LOW_PRIORITY = 1;

// Helper to determine the block type (e.g., paragraph, h1, quote)
const blockTypeToBlockName = {
  paragraph: 'Normal',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  quote: 'Quote',
  ul: 'Unordered List',
  ol: 'Ordered List',
};

export function PostEditorToolbar() {
    const [editor] = useLexicalComposerContext();
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isLink, setIsLink] = useState(false);
    const [isCode, setIsCode] = useState(false);
    const [blockType, setBlockType] = useState('paragraph');

    // PostEditorToolbar.tsx

const updateToolbar = useCallback(() => {
    const selection = $getSelection();

    // 🛑 FIX 1: Check if selection is NOT null AND is a RangeSelection
    if (!$isRangeSelection(selection)) {
        return; // Exit the function if no valid selection exists
    }

    // Now TypeScript knows 'selection' is a RangeSelection and NOT null
    const node = selection.getNodes()[0];
    const parent = node.getParent();

    // Text formats
    setIsBold(selection.hasFormat('bold'));
    setIsItalic(selection.hasFormat('italic'));
    setIsCode(selection.hasFormat('code'));

    // Block type
    // 🛑 FIX 2: Ensure editor.getElementByKey(node.getKey()) is NOT null before accessing tagName
    const element = editor.getElementByKey(node.getKey());
    const parentBlockType = element?.tagName.toLowerCase() || 'paragraph';
    setBlockType(parentBlockType);
    
    // Link status logic remains the same (it relies on 'selection' which is now checked)
    const linkElement = selection.anchor.getNode().getKey() === node.getKey()
        ? node.getParents().at(-1) // Check the most distant parent
        : parent;

    if (linkElement && $isLinkNode(linkElement)) {
        setIsLink(true);
    } else if (parent && $isLinkNode(parent)) {
        setIsLink(true);
    } else {
        setIsLink(false);
    }

}, [editor]);

    // Listen for selection changes (user moving cursor, selecting text)
    useEffect(() => {
        return editor.registerCommand(
            SELECTION_CHANGE_COMMAND,
            () => {
                updateToolbar();
                return false;
            },
            LOW_PRIORITY,
        );
    }, [editor, updateToolbar]);

    // Commands to apply text formatting
    const formatText = (format: 'bold' | 'italic' | 'code') => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    };
    
    // Command to insert link (Placeholder logic for simplicity)
    const insertLink = useCallback(() => {
        if (!isLink) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://'); // Replace with proper prompt/modal later
        } else {
            // Unlink command (same command, but nullifies the URL)
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        }
    }, [editor, isLink]);

    // Command to change block type (H3, Quote, List, etc.)
    const formatBlock = (type: string) => {
        if (type === 'quote') {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $wrapNodes(selection, () => $createQuoteNode());
                }
            });
        } else if (['h1', 'h2', 'h3'].includes(type)) {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $wrapNodes(selection, () => $createHeadingNode(type as HeadingTagType));
                }
            });
        } else if (type === 'ul') {
            // 🟢 New List Logic
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        } else if (type === 'ol') {
            // 🟢 New List Logic
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }
    };
    
    // Placeholder command to insert image (Will require a Modal/File Uploader later)
    const insertImage = () => {
        // This is a placeholder for the actual file upload modal/logic.
        // It should open a modal that captures the image URL (or uploads a file).
        alert("Image insertion will be added here! Use a Modal to handle upload.");
    };

    return (
        <div className="flex flex-wrap items-center space-x-2 border-b border-gray-200 py-1 px-2 mb-2 sticky top-0 bg-white z-10">
            {/* Block Type Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-[100px] justify-start">
                        {blockTypeToBlockName[blockType as keyof typeof blockTypeToBlockName] || 'Normal'}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {['paragraph', 'h3', 'quote'].map((type) => (
                        <DropdownMenuItem key={type} onClick={() => formatBlock(type)} className="capitalize">
                            {blockTypeToBlockName[type as keyof typeof blockTypeToBlockName]}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-6 w-[1px] bg-gray-300 mx-1"></div>

            {/* Text Formatting Buttons (Bold, Italic, Code) */}
            <Button 
                variant={isBold ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => formatText('bold')}
                aria-label="Format text as bold"
            >
                <Bold className="h-4 w-4" />
            </Button>
            <Button 
                variant={isItalic ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => formatText('italic')}
                aria-label="Format text as italic"
            >
                <Italic className="h-4 w-4" />
            </Button>
            <Button 
                variant={isCode ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => formatText('code')}
                aria-label="Format text as code"
            >
                <Code className="h-4 w-4" />
            </Button>
            
            <div className="h-6 w-[1px] bg-gray-300 mx-1"></div>

            {/* Link Button */}
            <Button 
                variant={isLink ? "secondary" : "ghost"} 
                size="sm" 
                onClick={insertLink}
                aria-label={isLink ? "Unlink" : "Insert link"}
            >
                {isLink ? <X className="h-4 w-4" /> : <Link className="h-4 w-4" />}
            </Button>

            {/* Image Button (Essential for a sports blog) */}
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={insertImage}
                aria-label="Insert image"
            >
                <ImageIcon className="h-4 w-4" />
            </Button>
            
            {/* List Buttons */}
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => formatBlock('ul')}
                aria-label="Unordered List"
            >
                <List className="h-4 w-4" />
            </Button>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => formatBlock('ol')}
                aria-label="Ordered List"
            >
                <ListOrdered className="h-4 w-4" />
            </Button>
        </div>
    );
}