import { useEffect } from "react";

const ROBOTS_META = "robots";
const NOINDEX_CONTENT = "noindex, nofollow";

export function PublicRouteMeta() {
  useEffect(() => {
    let meta = document.querySelector(`meta[name="${ROBOTS_META}"]`);
    const created = meta === null;
    if (created) {
      meta = document.createElement("meta");
      meta.setAttribute("name", ROBOTS_META);
      document.head.appendChild(meta);
    }

    if (meta === null) {
      return;
    }

    const previous = meta.getAttribute("content");
    meta.setAttribute("content", NOINDEX_CONTENT);

    return () => {
      if (created) {
        meta?.remove();
        return;
      }
      if (previous === null) {
        meta?.removeAttribute("content");
        return;
      }
      meta?.setAttribute("content", previous);
    };
  }, []);

  return null;
}
