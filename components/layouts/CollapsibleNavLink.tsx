'use client'
import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { NavLink } from "./NavLink";

interface CollapsibleNavLinkProps {
    category: { label: string; icon: React.ElementType; subItems: Array<{ label: string; basePath: string; icon: React.ElementType }> };
    currentPath: string;
    isSidebarOpen: boolean;
    onFlyoutToggle: (label: string, target: HTMLElement) => void;
    activeFlyoutLabel: string | null;
    onMobileLinkClick?: () => void;
    themeColor: string;
    buildLink: (basePath: string) => string;
}

export const CollapsibleNavLink: React.FC<CollapsibleNavLinkProps> = ({
    category,
    currentPath,
    isSidebarOpen,
    onFlyoutToggle,
    activeFlyoutLabel,
    onMobileLinkClick,
    themeColor,
    buildLink,
}) => {
    const [accordionOpen, setAccordionOpen] = useState(category.subItems.some(sub => currentPath.startsWith(sub.basePath)));
    const CategoryIcon = category.icon;
    const triggerRef = useRef<HTMLButtonElement>(null);

    const isCategoryActive = category.subItems.some(sub => currentPath.startsWith(sub.basePath));
    const isThisFlyoutActive = activeFlyoutLabel === category.label;

    useEffect(() => {
        if (isSidebarOpen && isCategoryActive) {
            setAccordionOpen(true);
        } else if (!isSidebarOpen) {
            setAccordionOpen(false);
        }
    }, [currentPath, category.subItems, isSidebarOpen, isCategoryActive]);

    const handleCategoryClick = () => {
        if (isSidebarOpen) {
            setAccordionOpen(!accordionOpen);
        } else {
            if (triggerRef.current) {
                onFlyoutToggle(isThisFlyoutActive ? "" : category.label, triggerRef.current);
            }
        }
    };

    const primary100 = `var(--color-${themeColor}-100)`;
    const primary600 = `var(--color-${themeColor}-600)`;

    return (
        <div className="relative group">
            <button
                ref={triggerRef}
                onClick={handleCategoryClick}
                className={`flex items-center justify-between w-full py-2.5 px-4 rounded-md border-l-4 transition-all duration-200 ease-in-out
                            ${isSidebarOpen ? "" : "justify-center"}
                            ${isCategoryActive ? "bg-[var(--hover-bg)] text-[var(--hover-text)] border-[var(--hover-text)]"
                                : "text-gray-700 border-transparent nav-hover"}`}
                title={isSidebarOpen ? "" : category.label}
                style={{
                    backgroundColor: isCategoryActive ? primary100 : undefined,
                    color: isCategoryActive ? primary600 : undefined,
                }}
            >
                <div className="flex items-center">
                    <CategoryIcon className={`w-5 h-5 transition-transform duration-150 group-hover:scale-105 ${isSidebarOpen ? "mr-3" : ""}`} />
                    {isSidebarOpen && <span className="text-sm font-medium">{category.label}</span>}
                </div>
                {isSidebarOpen && (
                    accordionOpen
                        ? <FiChevronDown className="w-5 h-5 transition-transform duration-200" />
                        : <FiChevronRight className="w-5 h-5 transition-transform duration-200" />
                )}
            </button>

            {/* Accordion */}
            {isSidebarOpen && (
                <div
                    className={`pl-5 mt-1 space-y-0.5 border-l-2 ml-3 overflow-hidden transition-all duration-300 ease-in-out`}
                    style={{
                        borderColor: primary100,
                        maxHeight: accordionOpen ? "500px" : "0px",
                        opacity: accordionOpen ? 1 : 0,
                    }}
                >
                    {category.subItems.map(subItem => (
                        <NavLink
                            key={subItem.basePath}
                            item={subItem}
                            currentPath={currentPath}
                            isSidebarOpen={isSidebarOpen}
                            onClick={onMobileLinkClick}
                            themeColor={themeColor}
                            buildLink={buildLink}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
