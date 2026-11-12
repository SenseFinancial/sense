"use client"
import Link from 'next/link';
import authClient from './auth-client';

export default function Footer() {
    const { data: session } = authClient.useSession();

    return (
        <div className="flex p-4 gap-4">
            <Link href="/privacy-policy" target='_blank'>Privacy Policy</Link>
            {session && (<button className="hover:cursor-pointer" onClick={() => authClient.signOut()}>Sign Out</button>)}
        </div>
    );
}