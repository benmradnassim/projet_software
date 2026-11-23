import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import ScrollToTop from './ScrollToTop';
import PageFallback from './PageFallback';

/** Pages de l'application : en-tête + barre latérale (si connecté) + contenu. */
export default function Layout() {
  const { isAuthenticated } = useAuth();
  return (
    <>
      <ScrollToTop />
      <Header />
      <div className={`appv${isAuthenticated ? ' logged' : ''}`}>
        {isAuthenticated && <Sidebar />}
        <main id="contenu" className="appmain">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </>
  );
}
