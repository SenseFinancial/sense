import React from "react";

export default function Button({ type = "button", children, className, ...props }: React.ComponentPropsWithoutRef<'button'>) {
    const combinedClassName = `rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-blue-700 focus:outline-none transition duration-150 ease-in-out active:scale-95 ${className}`;

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