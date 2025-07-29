// components/layouts/FlyoutMenu.tsx
'use client'
import { useClickAway } from "@/hooks";
import { RefObject, useRef } from "react";
// Ensure NavLink is imported from the correct path, likely the same directory
import { NavLink } from "./NavLink";

interface FlyoutMenuProps {
    items: Array<{ label: string; basePath: string; icon: React.ElementType }>;
    position: { top: number; left: number };
    currentPath: string;
    onClose: () => void;
    onLinkClick: () => void;
    triggerRef: RefObject<HTMLElement> | null;
    categoryLabel?: string;
    themeColor: string; // Add themeColor prop
    buildLink: (basePath: string) => string; // Pass the buildLink function
}

export const FlyoutMenu: React.FC<FlyoutMenuProps> = ({ items, position, currentPath, onClose, onLinkClick, triggerRef, categoryLabel, themeColor, buildLink }) => {
    const flyoutRef = useRef<HTMLDivElement>(null);
    useClickAway(
      triggerRef ? [flyoutRef as React.RefObject<HTMLElement>, triggerRef as React.RefObject<HTMLElement>]
                 : (flyoutRef as React.RefObject<HTMLElement>),
                   onClose
                 );

    // Define color variables based on the themeColor prop
    const primary700 = `var(--color-${themeColor}-700)`;

    return (
        <div
            ref={flyoutRef}
            className="absolute z-[100] w-56 bg-white shadow-2xl rounded-md py-2 mt-0.5 animate-fadeIn" // Added high z-index and simple fade
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
            {categoryLabel && (
                <div
                    className="px-3 py-2 text-sm font-semibold border-b mb-1"
                    style={{ color: primary700 }} // Apply theme color to category label text
                >
                    {categoryLabel}
                </div>
            )}
            {items.map(item => (
                <div key={item.basePath} className="px-1.5">
                    <NavLink
                        item={item}
                        currentPath={currentPath}
                        isSidebarOpen={true} // Flyout items always behave as if sidebar is open
                        isFlyout={true}
                        onClick={() => { onLinkClick(); onClose(); }}
                        themeColor={themeColor} // Pass themeColor
                        buildLink={buildLink} // Pass down the function
                    />
                </div>
            ))}
        </div>
    );
};