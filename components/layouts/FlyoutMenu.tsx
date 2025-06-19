import { useClickAway } from "@/hooks/useClickAway";
import { RefObject, useRef } from "react";
import { NavLink } from "./NavLink";

interface FlyoutMenuProps {
    items: Array<{ label: string; basePath: string; icon: React.ElementType }>;
    position: { top: number; left: number };
    currentPath: string;
    onClose: () => void;
    onLinkClick: () => void;
    triggerRef: RefObject<HTMLElement> | null;
    categoryLabel?: string;
}

export const FlyoutMenu: React.FC<FlyoutMenuProps> = ({ items, position, currentPath, onClose, onLinkClick, triggerRef, categoryLabel }) => {
    const flyoutRef = useRef<HTMLDivElement>(null);
    useClickAway(
      triggerRef ? [flyoutRef as React.RefObject<HTMLElement>, triggerRef as React.RefObject<HTMLElement>]
                 : (flyoutRef as React.RefObject<HTMLElement>),
                 onClose
                );

    return (
        <div
            ref={flyoutRef}
            className="absolute z-[100] w-56 bg-white shadow-2xl rounded-md py-2 mt-0.5 animate-fadeIn" // Added high z-index and simple fade
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
            {categoryLabel && <div className="px-3 py-2 text-sm font-semibold text-gray-700 border-b mb-1">
                {categoryLabel}
            </div>}
            {items.map(item => (
                <div key={item.basePath} className="px-1.5">
                    <NavLink
                        item={item}
                        currentPath={currentPath}
                        isSidebarOpen={true}
                        isFlyout={true}
                        onClick={() => { onLinkClick(); onClose(); }}
                    />
                </div>
            ))}
        </div>
    );
};