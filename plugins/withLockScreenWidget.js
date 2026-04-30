/**
 * Expo config plugin — adds android:widgetCategory="keyguard|home_screen"
 * to the LockScreenPrioritiesWidget AppWidget provider XML.
 *
 * Samsung One UI 5+ uses this attribute to decide which widgets appear in
 * the lock screen widget picker. Without it the widget only shows up in the
 * home screen picker, not the lock screen one.
 *
 * This plugin runs during prebuild AFTER react-native-android-widget has
 * already generated the appwidget-provider XML files, and patches the
 * correct file in place.
 */

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withLockScreenWidget(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/res/xml'
      );

      if (!fs.existsSync(xmlDir)) return config;

      const files = fs.readdirSync(xmlDir).filter(f => f.endsWith('.xml'));

      for (const file of files) {
        const filePath = path.join(xmlDir, file);
        const content = fs.readFileSync(filePath, 'utf8');

        // Match the XML file belonging to LockScreenPrioritiesWidget
        const isLockScreenWidget =
          file.toLowerCase().includes('lockscreen') ||
          content.includes('LockScreenPriorities');

        if (!isLockScreenWidget) continue;
        if (content.includes('widgetCategory')) continue; // already patched

        const patched = content.replace(
          '<appwidget-provider',
          '<appwidget-provider\n    android:widgetCategory="keyguard|home_screen"'
        );

        fs.writeFileSync(filePath, patched, 'utf8');
        console.log(`[withLockScreenWidget] Patched ${file} with widgetCategory="keyguard|home_screen"`);
      }

      return config;
    },
  ]);
}

module.exports = withLockScreenWidget;
