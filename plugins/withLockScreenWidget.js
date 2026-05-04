/**
 * Expo config plugin — lock screen widget support (Samsung One UI 5+)
 *
 * What this does:
 *
 *  1. Sets android:exported="true" on every AppWidget receiver.
 *     Android 12+ requires this or the system widget picker won't list the
 *     widget at all (neither home screen nor lock screen).
 *
 *  2. Patches android:widgetCategory in every generated widget XML:
 *     - Most widgets → "home_screen|keyguard"  (appear in BOTH pickers)
 *     - LockScreenPrioritiesWidget → "keyguard" (lock screen panel only)
 *
 * Platform support:
 *   - Samsung One UI 5.0+ : lock screen widgets are fully supported via the
 *     keyguard widgetCategory. Users add them by long-pressing the lock screen
 *     → Widgets → [widget name].
 *   - Stock Android 5.0+  : lock screen widgets were removed by Google and
 *     cannot be re-enabled. Home screen widgets still work normally.
 *   - iOS                 : react-native-android-widget is Android-only.
 *     iOS lock screen widgets require native Swift/WidgetKit code.
 */

const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

// Widgets that should appear ONLY in the Samsung lock screen panel,
// not in the regular home screen widget picker.
const LOCK_SCREEN_ONLY = new Set(['LockScreenPrioritiesWidget']);

// Every widget registered in app.json.
// Keep this in sync with the react-native-android-widget plugins array.
const ALL_WIDGETS = [
  'BudgetWidget',
  'TasksWidget',
  'HabitsWidget',
  'CalendarWidget',
  'NotesWidget',
  'PrioritiesWidget',
  'GiftsWidget',
  'BingoWidget',
  'LockScreenPrioritiesWidget',
  'BrainDumpWidget',
];

// react-native-android-widget generates one XML file per widget using this
// naming convention: widgetprovider_<lowercasename>.xml
function xmlFilename(widgetName) {
  return `widgetprovider_${widgetName.toLowerCase()}.xml`;
}

module.exports = function withLockScreenWidget(config) {
  // ── Step 1: exported="true" on all widget receivers ────────────────────────
  config = withAndroidManifest(config, (config) => {
    const receivers = config.modResults.manifest.application?.[0]?.receiver ?? [];
    for (const receiver of receivers) {
      const name = receiver.$?.['android:name'] ?? '';
      if (ALL_WIDGETS.some((w) => name.includes(w))) {
        receiver.$['android:exported'] = 'true';
      }
    }
    return config;
  });

  // ── Step 2: widgetCategory in provider XML files ────────────────────────────
  config = withDangerousMod(config, [
    'android',
    (config) => {
      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'res', 'xml'
      );

      for (const widgetName of ALL_WIDGETS) {
        const filename = xmlFilename(widgetName);
        const xmlPath = path.join(xmlDir, filename);

        if (!fs.existsSync(xmlPath)) {
          console.warn(`[withLockScreenWidget] Not found (will be generated later): ${filename}`);
          continue;
        }

        const category = LOCK_SCREEN_ONLY.has(widgetName)
          ? 'keyguard'
          : 'home_screen|keyguard';

        let content = fs.readFileSync(xmlPath, 'utf8');

        if (content.includes(`android:widgetCategory="${category}"`)) {
          // Already correct — nothing to do.
          continue;
        }

        if (content.includes('android:widgetCategory=')) {
          // Replace whatever value is already there.
          content = content.replace(
            /android:widgetCategory="[^"]*"/,
            `android:widgetCategory="${category}"`
          );
        } else {
          // Attribute is missing entirely — insert it on the opening tag.
          content = content.replace(
            /(<appwidget-provider[^>]*)(\/?>)/s,
            `$1\n  android:widgetCategory="${category}"$2`
          );
        }

        fs.writeFileSync(xmlPath, content, 'utf8');
        console.log(`[withLockScreenWidget] ${filename} → widgetCategory="${category}"`);
      }

      return config;
    },
  ]);

  return config;
};
