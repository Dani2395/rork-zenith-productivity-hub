/**
 * Expo config plugin — changes android:widgetCategory from "home_screen"
 * to "keyguard|home_screen" for the LockScreenPrioritiesWidget.
 *
 * Samsung One UI 5+ uses this attribute to decide which widgets appear
 * in the lock screen widget picker. Without "keyguard", no widgets from
 * this app appear there.
 *
 * react-native-android-widget generates:
 *   {projectRoot}/android/app/src/main/res/xml/widgetprovider_{lowercasedname}.xml
 * and always writes widgetCategory="home_screen" — this plugin replaces it.
 */

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/** Recursively find every file matching `filename` under `dir`. */
function findRecursive(dir, filename) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findRecursive(full, filename));
    } else if (entry.name === filename) {
      results.push(full);
    }
  }
  return results;
}

function withLockScreenWidget(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;

      const targetFilename = 'widgetprovider_lockscreenprioritieswidget.xml';

      // 1. Try the two most likely explicit paths first (fastest).
      const explicitCandidates = [
        path.join(projectRoot, 'android/app/src/main/res/xml', targetFilename),
        path.join(platformRoot, 'app/src/main/res/xml', targetFilename),
      ];

      let targetPath = null;
      for (const p of explicitCandidates) {
        if (fs.existsSync(p)) { targetPath = p; break; }
      }

      // 2. Fallback: recursive search under android/ (covers unexpected paths).
      if (!targetPath) {
        const androidDir = fs.existsSync(path.join(projectRoot, 'android'))
          ? path.join(projectRoot, 'android')
          : platformRoot;
        console.warn('[withLockScreenWidget] Explicit paths not found, scanning', androidDir);
        const found = findRecursive(androidDir, targetFilename);
        if (found.length > 0) {
          targetPath = found[0];
          console.warn('[withLockScreenWidget] Found via recursive scan:', targetPath);
        }
      }

      if (!targetPath) {
        console.error('[withLockScreenWidget] FAILED — file not found anywhere.');
        console.error('[withLockScreenWidget] projectRoot:', projectRoot);
        console.error('[withLockScreenWidget] platformRoot:', platformRoot);
        // List xml dirs to help debug
        const xmlDirs = [
          path.join(projectRoot, 'android/app/src/main/res/xml'),
          path.join(platformRoot, 'app/src/main/res/xml'),
        ];
        for (const d of xmlDirs) {
          if (fs.existsSync(d)) {
            console.error('[withLockScreenWidget] Contents of', d + ':', fs.readdirSync(d).join(', '));
          } else {
            console.error('[withLockScreenWidget] Dir does not exist:', d);
          }
        }
        return config;
      }

      const content = fs.readFileSync(targetPath, 'utf8');

      if (content.includes('keyguard')) {
        console.log('[withLockScreenWidget] Already patched:', targetPath);
        return config;
      }

      if (!content.includes('android:widgetCategory="home_screen"')) {
        console.warn('[withLockScreenWidget] Expected widgetCategory="home_screen" not found in:', targetPath);
        console.warn('[withLockScreenWidget] File content:', content);
        return config;
      }

      const patched = content.replace(
        'android:widgetCategory="home_screen"',
        'android:widgetCategory="keyguard|home_screen"'
      );
      fs.writeFileSync(targetPath, patched, 'utf8');
      console.log('[withLockScreenWidget] Patched:', targetPath);

      return config;
    },
  ]);
}

module.exports = withLockScreenWidget;
