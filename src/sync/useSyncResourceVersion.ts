import { useEffect, useState } from "react";
import { SYNC_EVENT_NAME, type SyncEventDetail } from "./syncEvents";

export function useSyncResourceVersion(resource: string) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handleSync = (event: Event) => {
      const detail = (event as CustomEvent<SyncEventDetail>).detail;
      const matches = detail?.events?.some((item) =>
        item.resource?.toLowerCase() === resource.toLowerCase() ||
        item.path?.toLowerCase().includes(`/${resource.toLowerCase()}`)
      );
      if (matches) setVersion((current) => current + 1);
    };
    window.addEventListener(SYNC_EVENT_NAME, handleSync);
    return () => window.removeEventListener(SYNC_EVENT_NAME, handleSync);
  }, [resource]);

  return version;
}
