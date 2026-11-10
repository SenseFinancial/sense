"use client"
import authClient from './../../auth-client';
import SignInButton from "./../sign-in-button";

export default function CheckSignIn({ children }: { children: React.ReactNode }) {
    const { data: session, isPending } = authClient.useSession();

    if (isPending) return (
        <div className="mx-auto p-4 w-fit">
            Loading...
        </div>
    );

    if (!session) {
        return (
            <div className="mx-auto p-4 w-fit">
                <SignInButton />
            </div>
        );
    }

    return children;
}