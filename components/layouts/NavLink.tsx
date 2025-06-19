import Link from "next/link";

interface NavLinkProps {
    item: { label: string; basePath: string; icon: React.ElementType };
    currentPath: string;
    isSidebarOpen: boolean;
    isFlyout?: boolean;
    onClick?: () => void;
}

export const NavLink: React.FC<NavLinkProps> = ({ item, currentPath, isSidebarOpen, isFlyout, onClick }) => {
    const isActive = currentPath === item.basePath;
    const Icon = item.icon;
    return (
        <Link
            href={item.basePath}
            onClick={onClick}
            className={`flex items-center py-2.5 px-4 rounded-md transition-colors duration-150
                ${isActive
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                }
                ${!isSidebarOpen && !isFlyout && "justify-center"}
                ${isFlyout && "w-full"}`}
            title={isSidebarOpen || isFlyout ? "" : item.label}
        >
            <Icon className={`w-5 h-5 ${(isSidebarOpen || isFlyout) ? "mr-3" : ""}`} />
            {(isSidebarOpen || isFlyout) && <span className="text-sm">{item.label}</span>}
        </Link>
    );
};