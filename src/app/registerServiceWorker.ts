export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;
  window.addEventListener("load", () => {
    const base = import.meta.env.BASE_URL || "/";
    const workerUrl = `${base}sw.js`;
    void navigator.serviceWorker.register(workerUrl, { scope: base }).catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  });
}
