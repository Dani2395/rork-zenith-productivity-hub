export function redirectSystemPath({
  path,
  initial,
}: { path: string; initial: boolean }) {
  try {
    // Strip the scheme prefix so we get just the path portion
    // e.g. "rork-app:///tasks" → "/tasks"
    const url = new URL(path);
    const pathname = url.pathname || '/';
    const search = url.search ?? '';
    const base = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return search ? `${base}${search}` : base;
  } catch {
    return '/';
  }
}
