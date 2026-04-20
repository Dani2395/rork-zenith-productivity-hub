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

    // Convenience shortcuts:
    //   rork-app:///add-task?name=Buy+milk&priority=high
    //     → /voice-add?type=task&name=Buy+milk&priority=high
    //   rork-app:///add-note?name=Remember+this
    //     → /voice-add?type=note&name=Remember+this
    if (base === '/add-task') {
      return `/voice-add?type=task${search ? '&' + search.slice(1) : ''}`;
    }
    if (base === '/add-note') {
      return `/voice-add?type=note${search ? '&' + search.slice(1) : ''}`;
    }
    if (base === '/add-priority') {
      return `/voice-add?type=priority${search ? '&' + search.slice(1) : ''}`;
    }

    return search ? `${base}${search}` : base;
  } catch {
    return '/';
  }
}
