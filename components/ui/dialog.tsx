// Mock Dialog components (simplified for basic functionality)
import React from "react";

export const Dialog = ({ open, onOpenChange, children }: any) => {
  return (
    <>
      {React.Children.map(children, child =>
        child.type === DialogTrigger ? React.cloneElement(child, { onClick: () => onOpenChange(!open) }) : null
      )}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center">
          {/* Dialog Overlay */}
          <div className="fixed inset-0" onClick={() => onOpenChange(false)}></div>
          {/* Dialog Content Wrapper */}
          <div className="relative z-50">
            {React.Children.map(children, child =>
              child.type === DialogContent ? React.cloneElement(child, { onOpenChange }) : null
            )}
          </div>
        </div>
      )}
    </>
  );
};

export const DialogTrigger = ({ asChild, children, onClick }: any) => {
  if (asChild) {
    return React.cloneElement(children, { onClick });
  }
  return <button onClick={onClick}>{children}</button>;
};

export const DialogContent = ({ children, onOpenChange, className }: any) => (
  <div className={`bg-white p-6 rounded-lg shadow-xl relative ${className}`}>
    {children}
    {/* Close button inside dialog content */}
    <button
      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      onClick={() => onOpenChange(false)}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
  </div>
);

export const DialogHeader = ({ children, className }: any) => (
  <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}>
    {children}
  </div>
);

export const DialogTitle = ({ children, className }: any) => (
  <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h2>
);

export const DialogDescription = ({ children, className }: any) => (
  <p className={`text-sm text-muted-foreground ${className}`}>
    {children}
  </p>
);

export const DialogFooter = ({ children, className }: any) => (
  <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}>
    {children}
  </div>
);
