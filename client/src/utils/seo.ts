export function setPageSeo(title: string, description?: string) {
  document.title = title;
  if (description === undefined) return;
  let el = document.querySelector('meta[name="description"]');
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", "description");
    document.head.appendChild(el);
  }
  el.setAttribute("content", description);
}
