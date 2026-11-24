import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import ScrollToTop from './ScrollToTop';
import PageFallback from './PageFallback';
import './layout.css';

/**
 * Pages publiques pleine largeur.
 * `bare` : sans en-tête (connexion / inscription, comme dans la maquette).
 */
export default function PublicLayout({ bare = false }) {
  return (
    <>
      <ScrollToTop />
      {!bare && <Header />}
      <main id="contenu">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </>
  );
}
