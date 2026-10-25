//app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'UIINAPUR — A world to call yours', description: 'Explore a living fictional nation. Discover seven territories, create your citizenship and build your own corner of Uiinapur.', icons: { icon: '/favicon.svg' } };
export default function RootLayout({ children }: {
    children: React.ReactNode;
}) { return <html lang="en"><body>{children}</body></html>; }
