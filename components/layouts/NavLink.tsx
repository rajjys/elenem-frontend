import Link from "next/link";

interface NavLinkProps {
    item: { label: string; basePath: string; icon: React.ElementType };
    currentPath: string;
    isSidebarOpen: boolean;
    isFlyout?: boolean;
    onClick?: () => void;
    themeColor: string;
    buildLink: (basePath: string) => string;
}

export const NavLink: React.FC<NavLinkProps> = ({
    item,
    currentPath,
    isSidebarOpen,
    isFlyout,
    onClick,
    themeColor,
    buildLink,
}) => {
    const finalHref = buildLink(item.basePath);
    const isActive = currentPath === item.basePath;
    const Icon = item.icon;

    // Define variables
    const primary600 = `var(--color-${themeColor}-600)`;
    const primary50 = `var(--color-${themeColor}-50)`;

    return (
        <Link
            href={finalHref}
            onClick={onClick}
            className={`flex items-center py-2.5 px-4 rounded-md transition-all duration-200 ease-in-out border-l-4
                ${isActive
                    ? "font-semibold bg-[var(--hover-bg)] text-[var(--hover-text)] border-[var(--hover-text)]"
                    : "text-gray-600 border-transparent nav-hover"}
                ${!isSidebarOpen && !isFlyout ? "justify-center" : ""}
                ${isFlyout ? "w-full" : ""}`}
            title={isSidebarOpen || isFlyout ? "" : item.label}
            style={{
                backgroundColor: isActive ? primary50 : undefined,
                color: isActive ? primary600 : undefined,
            }}
        >
            <Icon className={`w-5 h-5 transition-transform duration-150 group-hover:scale-105 ${isSidebarOpen || isFlyout ? "mr-3" : ""}`} />
            {(isSidebarOpen || isFlyout) && <span className="text-sm">{item.label}</span>}
        </Link>
    );
};
