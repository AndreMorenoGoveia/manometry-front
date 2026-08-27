import { useEffect, useState } from "react";

/**
 * False on the first paint, true right after.
 *
 * A CSS transition only runs when the property changes *after* the element is
 * in the document, so a bar or a gauge that mounts already at its final value
 * simply snaps. Gate the value on this and it grows into place instead.
 */
export function useAfterMount(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return mounted;
}
