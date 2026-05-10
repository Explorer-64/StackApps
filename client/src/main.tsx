import { pwaTeardown } from "./pwaTeardown";

pwaTeardown()
  .catch(() => {
    /* best-effort */
  })
  .then(() => import("./app-root"))
  .then(() => {
    /* app-root is side effects only; module has no exports to await */
  })
  .catch((err) => {
    if (import.meta.env.DEV) {
      throw err;
    }
    const el = document.getElementById("root");
    if (el) {
      el.innerHTML =
        '<p style="font-family:system-ui,sans-serif;max-width:20rem;margin:2rem auto;padding:1rem;color:#e5e5e5" role="alert">The app could not be loaded. Check your connection and try this page again.</p>';
    }
  });
