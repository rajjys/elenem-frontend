// components/layouts/NavLink.tsx
import Link from "next/link";

interface NavLinkProps {
    item: { label: string; basePath: string; icon: React.ElementType };
    currentPath: string;
    isSidebarOpen: boolean;
    isFlyout?: boolean;
    onClick?: () => void;
    themeColor: string; // Add themeColor prop
}

export const NavLink: React.FC<NavLinkProps> = ({ item, currentPath, isSidebarOpen, isFlyout, onClick, themeColor }) => {
    const isActive = currentPath === item.basePath;
    const Icon = item.icon;

    // Define color variables based on the themeColor prop
    const primary600 = `var(--color-${themeColor}-600)`;
    const primary50 = `var(--color-${themeColor}-50)`; // Assuming you'll add this to tailwind config
    const primary700 = `var(--color-${themeColor}-700)`;

    return (
        <Link
            href={item.basePath}
            onClick={onClick}
            className={`flex items-center py-2.5 px-4 rounded-md transition-colors duration-150
                ${isActive
                    ? `bg-[${primary600}] text-white font-semibold` // Active state
                    : `text-gray-600 hover:bg-[${primary50}] hover:text-[${primary600}]` // Inactive state
                }
                ${!isSidebarOpen && !isFlyout && "justify-center"}
                ${isFlyout && "w-full"}`}
            title={isSidebarOpen || isFlyout ? "" : item.label}
            style={{
              backgroundColor: isActive ? primary600 : undefined,
              color: isActive ? 'white' : undefined,
              '--hover-bg': primary50, // Custom CSS variable for hover background
              '--hover-text': primary600 // Custom CSS variable for hover text color
            } as React.CSSProperties} // Cast to allow custom CSS variables
        >
            <Icon className={`w-5 h-5 ${(isSidebarOpen || isFlyout) ? "mr-3" : ""}`} />
            {(isSidebarOpen || isFlyout) && <span className="text-sm">{item.label}</span>}
        </Link>
    );
};
