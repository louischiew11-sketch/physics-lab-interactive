import './globals.css';
import Link from 'next/link';
// Replace Github with Code
import { Beaker, Code, Globe } from 'lucide-react';

export const metadata = {
  title: 'Physics Lab | Interactive Learning',
  description: 'An interactive physics sandbox built with Matter.js and Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 flex flex-col min-h-screen font-sans selection:bg-cyan-500/30">
        
        {/* Global Professional Header */}
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
              <Link href="#" className="hover:text-cyan-400 transition-colors">Curriculum</Link>
              <Link href="#" className="hover:text-cyan-400 transition-colors">About</Link>
            </nav>

            <Link href="/lab" className="px-4 py-2 bg-slate-100 text-slate-900 font-semibold rounded-lg text-sm hover:bg-cyan-400 transition-colors">
              Launch Sandbox
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-grow relative">
          {children}
        </main>

        {/* Global Footer */}
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

      </body>
    </html>
  );
}