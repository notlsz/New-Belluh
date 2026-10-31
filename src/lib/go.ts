// Moves between the public pages without a reload: the address changes and App's popstate handler shows the page.
export const go = (path: string) => {
  if (window.location.pathname !== path) window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0 });
};
