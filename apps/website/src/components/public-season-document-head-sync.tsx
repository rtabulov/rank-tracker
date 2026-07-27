import { useEffect } from "react";
import {
  publicSeasonDocumentHead,
  type PublicSeasonDocumentHeadInput,
} from "@/lib/public-season-document-head";

/**
 * Applies Public Season document head in the client (tests + client navigations).
 * SSR/crawlers get the same values from the route `head` option via HeadContent.
 */
export function PublicSeasonDocumentHeadSync({ input }: { input: PublicSeasonDocumentHeadInput }) {
  const kind = input.kind;
  const displayName = input.kind === "available" ? input.displayName : null;

  useEffect(() => {
    const head = publicSeasonDocumentHead(
      kind === "available" && displayName !== null
        ? { kind: "available", displayName }
        : { kind: "unavailable" },
    );
    const previousTitle = document.title;
    document.title = head.title;

    const applied: Array<{
      el: HTMLMetaElement;
      created: boolean;
      previousContent: string | null;
    }> = [];

    for (const entry of head.meta) {
      const name = entry.name;
      const property = entry.property;
      const content = entry.content;
      if (content === undefined || (name === undefined && property === undefined)) {
        continue;
      }

      let el: HTMLMetaElement | null = null;
      if (name !== undefined) {
        el = document.querySelector(`meta[name="${name}"]`);
      } else if (property !== undefined) {
        el = document.querySelector(`meta[property="${property}"]`);
      }

      const created = el === null;
      if (created) {
        el = document.createElement("meta");
        if (name !== undefined) {
          el.setAttribute("name", name);
        }
        if (property !== undefined) {
          el.setAttribute("property", property);
        }
        document.head.appendChild(el);
      }

      if (el === null) {
        continue;
      }

      applied.push({ el, created, previousContent: el.getAttribute("content") });
      el.setAttribute("content", content);
    }

    return () => {
      document.title = previousTitle;
      for (const { el, created, previousContent } of applied) {
        if (created) {
          el.remove();
          continue;
        }
        if (previousContent === null) {
          el.removeAttribute("content");
          continue;
        }
        el.setAttribute("content", previousContent);
      }
    };
  }, [kind, displayName]);

  return null;
}
