import React from "react";

export default function Button({ type = "button", children, className, ...props }: React.ComponentPropsWithoutRef<'button'>) {
    const combinedClassName = `rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-blue-700 focus:outline-none ${className}`;

    return (
        <button
            type={type}
            className={combinedClassName}
            {...props}
        >
            {children}
        </button>
    );
}