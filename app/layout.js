import './globals.css';
import NavigationWrapper from './NavigationWrapper';

export const metadata = {
  title: 'Physics Lab | Interactive Learning',
  description: 'An interactive physics sandbox built with Matter.js and Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 flex flex-col min-h-screen font-sans selection:bg-cyan-500/30">
        <NavigationWrapper>
          {children}
        </NavigationWrapper>
      </body>
    </html>
  );
}