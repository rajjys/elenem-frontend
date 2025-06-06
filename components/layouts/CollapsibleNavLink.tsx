import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { NavLink } from "./NavLink";

interface CollapsibleNavLinkProps {
    category: { label: string; icon: React.ElementType; subItems: Array<{ label: string; href: string; icon: React.ElementType }> };
    currentPath: string;
    isSidebarOpen: boolean;
    onFlyoutToggle: (label: string, target: HTMLElement) => void;
    activeFlyoutLabel: string | null;
    onMobileLinkClick?: () => void;
}

export const CollapsibleNavLink: React.FC<CollapsibleNavLinkProps> = ({ category, currentPath, isSidebarOpen, onFlyoutToggle, activeFlyoutLabel, onMobileLinkClick }) => {
    const [accordionOpen, setAccordionOpen] = useState(category.subItems.some(sub => currentPath.startsWith(sub.href)));
    const CategoryIcon = category.icon;
    const triggerRef = useRef<HTMLButtonElement>(null);
    const isCategoryActive = category.subItems.some(sub => currentPath === sub.href);
    const isThisFlyoutActive = activeFlyoutLabel === category.label;

    useEffect(() => {
        if (isSidebarOpen && category.subItems.some(sub => currentPath.startsWith(sub.href))) {
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
    
    const categoryButtonActiveStyle = (isSidebarOpen && isCategoryActive) || (!isSidebarOpen && isThisFlyoutActive)
        ? "bg-indigo-100 text-indigo-700" 
        : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600";

    return (
        <div className="relative">
            <button
                ref={triggerRef}
                onClick={handleCategoryClick}
                className={`flex items-center justify-between w-full py-2.5 px-4 rounded-md transition-colors duration-150 
                            ${categoryButtonActiveStyle}
                            ${!isSidebarOpen && "justify-center"}`}
                title={isSidebarOpen ? "" : category.label}
            >
                <div className="flex items-center">
                    <CategoryIcon className={`w-5 h-5 ${isSidebarOpen ? "mr-3" : ""}`} />
                    {isSidebarOpen && <span className="text-sm font-medium">{category.label}</span>}
                </div>
                {isSidebarOpen && (accordionOpen ? <FiChevronDown className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5" />)}
            </button>
            {isSidebarOpen && accordionOpen && (
                <div className="pl-5 mt-1 space-y-0.5 border-l-2 border-indigo-100 ml-3">
                    {category.subItems.map(subItem => (
                        <NavLink
                            key={subItem.href}
                            item={subItem}
                            currentPath={currentPath}
                            isSidebarOpen={isSidebarOpen}
                            onClick={onMobileLinkClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};