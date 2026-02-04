import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Hook that handles scrolling to hash anchors when navigating between pages
 */
export const useHashScroll = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      // Small delay to ensure the DOM is ready
      setTimeout(() => {
        const element = document.querySelector(location.hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, [location]);
};
