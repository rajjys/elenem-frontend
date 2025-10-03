'use client'
import { useClickAway } from "@/hooks";
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
    themeColor: string;
    buildLink: (basePath: string) => string;
}

export const FlyoutMenu: React.FC<FlyoutMenuProps> = ({
    items,
    position,
    currentPath,
    onClose,
    onLinkClick,
    triggerRef,
    categoryLabel,
    themeColor,
    buildLink,
}) => {
    const flyoutRef = useRef<HTMLDivElement>(null);
    useClickAway(
        triggerRef
            ? [flyoutRef as RefObject<HTMLElement>, triggerRef as RefObject<HTMLElement>]
            : (flyoutRef as RefObject<HTMLElement>),
        onClose
    );

    const primary700 = `var(--color-${themeColor}-700)`;

    return (
        <div
            ref={flyoutRef}
            className="absolute z-[100] w-56 bg-white shadow-2xl rounded-md py-2 mt-0.5 origin-top-left transition-all duration-200 ease-out transform opacity-0 scale-95 animate-fadeIn"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                opacity: 1,
                transform: "scale(1)",
            }}
        >
            {categoryLabel && (
                <div
                    className="px-3 py-2 text-sm font-semibold border-b mb-1"
                    style={{ color: primary700 }}
                >
                    {categoryLabel}
                </div>
            )}
            {items.map(item => (
                <div key={item.basePath} className="px-1.5">
                    <NavLink
                        item={item}
                        currentPath={currentPath}
                        isSidebarOpen={true}
                        isFlyout={true}
                        onClick={() => { onLinkClick(); onClose(); }}
                        themeColor={themeColor}
                        buildLink={buildLink}
                    />
                </div>
            ))}
        </div>
    );
};
