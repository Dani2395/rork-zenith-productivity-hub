export function redirectSystemPath({
  path,
  initial,
}: { path: string; initial: boolean }) {
  try {
    // Strip the scheme prefix so we get just the path portion
    // e.g. "rork-app:///tasks" → "/tasks"
    const url = new URL(path);
    const pathname = url.pathname || '/';
    // Ensure it starts with /
    return pathname.startsWith('/') ? pathname : `/${pathname}`;
  } catch {
    return '/';
  }
}
