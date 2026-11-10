import React from "react";

type ButtonProps = React.ComponentPropsWithoutRef<'button'>;

export default function Button({ type = "button", children, ...props }: ButtonProps) {
    return (
        <button
            type={type}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-blue-700 focus:outline-none"
            {...props}
        >
            {children}
        </button>
    );
}