// components/layouts/CollapsibleNavLink.tsx
import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
// Ensure NavLink is imported from the correct path, likely the same directory
import { NavLink } from "./NavLink";

interface CollapsibleNavLinkProps {
    category: { label: string; icon: React.ElementType; subItems: Array<{ label: string; basePath: string; icon: React.ElementType }> };
    currentPath: string;
    isSidebarOpen: boolean;
    onFlyoutToggle: (label: string, target: HTMLElement) => void;
    activeFlyoutLabel: string | null;
    onMobileLinkClick?: () => void;
    themeColor: string; // Add themeColor prop
}

export const CollapsibleNavLink: React.FC<CollapsibleNavLinkProps> = ({ category, currentPath, isSidebarOpen, onFlyoutToggle, activeFlyoutLabel, onMobileLinkClick, themeColor }) => {
    const [accordionOpen, setAccordionOpen] = useState(category.subItems.some(sub => currentPath.startsWith(sub.basePath)));
    const CategoryIcon = category.icon;
    const triggerRef = useRef<HTMLButtonElement>(null);
    // isActive check should be based on `startsWith` for categories, not exact match
    const isCategoryActive = category.subItems.some(sub => currentPath.startsWith(sub.basePath));
    const isThisFlyoutActive = activeFlyoutLabel === category.label;

    useEffect(() => {
        if (isSidebarOpen && category.subItems.some(sub => currentPath.startsWith(sub.basePath))) {
            setAccordionOpen(true);
        } else if (!isSidebarOpen) {
            setAccordionOpen(false);
        }
    }, [currentPath, category.subItems, isSidebarOpen]);

    const handleCategoryClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (isSidebarOpen) {
            setAccordionOpen(!accordionOpen);
        } else {
            if (triggerRef.current) {
                onFlyoutToggle(isThisFlyoutActive ? "" : category.label, triggerRef.current);
            }
        }
    };

    // Define color variables based on the themeColor prop
    const primary100 = `var(--color-${themeColor}-100)`;
    const primary50 = `var(--color-${themeColor}-50)`; // Assuming you'll add this to tailwind config
    const primary600 = `var(--color-${themeColor}-600)`;
    const primary700 = `var(--color-${themeColor}-700)`;

    // Apply dynamic styles using CSS variables
    const categoryButtonActiveStyle = (isSidebarOpen && isCategoryActive) || (!isSidebarOpen && isThisFlyoutActive)
        ? `bg-[${primary100}] text-[${primary700}]`
        : `text-gray-700 hover:bg-[${primary50}] hover:text-[${primary600}]`;

    return (
        <div className="relative">
            <button
                ref={triggerRef}
                onClick={handleCategoryClick}
                className={`flex items-center justify-between w-full py-2.5 px-4 rounded-md transition-colors duration-150
                            ${categoryButtonActiveStyle}
                            ${!isSidebarOpen && "justify-center"}`}
                title={isSidebarOpen ? "" : category.label}
                style={{
                  backgroundColor: (isSidebarOpen && isCategoryActive) || (!isSidebarOpen && isThisFlyoutActive) ? primary100 : undefined,
                  color: (isSidebarOpen && isCategoryActive) || (!isSidebarOpen && isThisFlyoutActive) ? primary700 : undefined,
                  '--hover-bg': primary50, // Custom CSS variable for hover background
                  '--hover-text': primary600 // Custom CSS variable for hover text color
                } as React.CSSProperties} // Cast to allow custom CSS variables
            >
                <div className="flex items-center">
                    <CategoryIcon className={`w-5 h-5 ${isSidebarOpen ? "mr-3" : ""}`} />
                    {isSidebarOpen && <span className="text-sm font-medium">{category.label}</span>}
                </div>
                {isSidebarOpen && (accordionOpen ? <FiChevronDown className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5" />)}
            </button>
            {isSidebarOpen && accordionOpen && (
                <div
                    className="pl-5 mt-1 space-y-0.5 border-l-2 ml-3"
                    style={{ borderColor: primary100 }} // Apply theme color to border
                >
                    {category.subItems.map(subItem => (
                        <NavLink
                            key={subItem.basePath}
                            item={subItem}
                            currentPath={currentPath}
                            isSidebarOpen={isSidebarOpen}
                            onClick={onMobileLinkClick}
                            themeColor={themeColor} // Pass themeColor
                        />
                    ))}
                </div>
            )}
        </div>
    );
};