import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Every new page opens at the top. Back/forward (POP) is left alone so the browser can return to where
 * the visitor was; links to an #anchor are left alone too.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();

  useLayoutEffect(() => {
    if (navType === 'POP' || hash) return;
    // 'instant': the site sets scroll-behavior: smooth, which would otherwise animate the jump
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash, navType]);

  return null;
};
