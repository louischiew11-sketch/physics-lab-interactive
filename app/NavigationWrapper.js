'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Beaker, Code, Globe } from 'lucide-react';

export default function NavigationWrapper({ children }) {
  const pathname = usePathname();
  const isLab = pathname === '/lab';

  // If we are in the Lab, render ONLY the sandbox (No Header/Footer)
  if (isLab) {
    return <main className="flex-grow relative h-screen w-full">{children}</main>;
  }

  // Otherwise, render the professional layout for the rest of the website
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20 group-hover:border-cyan-400 transition-colors">
              <Beaker className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="font-bold text-lg tracking-tight">Physics<span className="text-cyan-400">Lab</span></span>
          </Link>
          
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-300">
            <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            <Link href="/lab" className="hover:text-cyan-400 transition-colors">Interactive Lab</Link>
            <Link href="/curriculum" className="hover:text-cyan-400 transition-colors">Curriculum</Link>
            <Link href="/about" className="hover:text-cyan-400 transition-colors">About</Link>
          </nav>

          <Link href="/lab" className="px-4 py-2 bg-slate-100 text-slate-900 font-semibold rounded-lg text-sm hover:bg-cyan-400 transition-colors">
            Launch Sandbox
          </Link>
        </div>
      </header>

      <main className="flex-grow relative">
        {children}
      </main>

      <footer className="border-t border-slate-800 bg-slate-900 relative z-40">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} PhysicsLab EdTech. All rights reserved.
          </p>
          <div className="flex gap-4 text-slate-500">
            <a href="#" className="hover:text-cyan-400 transition-colors" title="Source Code"><Code className="w-5 h-5" /></a>
            <a href="#" className="hover:text-cyan-400 transition-colors" title="Website"><Globe className="w-5 h-5" /></a>
          </div>
        </div>
      </footer>
    </>
  );
}