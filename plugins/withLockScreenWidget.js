/**
 * Expo config plugin — adds android:widgetCategory="keyguard|home_screen"
 * to the LockScreenPrioritiesWidget AppWidget provider XML.
 *
 * Samsung One UI 5+ uses this attribute to decide which widgets appear
 * in the lock screen widget picker. Without it, no widgets show up there.
 *
 * react-native-android-widget generates XML files named:
 *   rn_widget_{lowercasedwidgetname}.xml
 * e.g. LockScreenPrioritiesWidget → rn_widget_lockscreenprioritieswidget.xml
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

      if (!fs.existsSync(xmlDir)) {
        console.warn('[withLockScreenWidget] xml dir not found:', xmlDir);
        return config;
      }

      const allFiles = fs.readdirSync(xmlDir).filter(f => f.endsWith('.xml'));
      console.log('[withLockScreenWidget] XML files found:', allFiles.join(', '));

      // react-native-android-widget lowercases the widget name for the filename
      const expectedName = 'rn_widget_lockscreenprioritieswidget.xml';

      // Try exact match first, then fall back to a loose scan
      const targetFile =
        allFiles.find(f => f === expectedName) ||
        allFiles.find(f => f.replace(/_/g, '').toLowerCase().includes('lockscreenpriorities')) ||
        allFiles.find(f => f.replace(/_/g, '').toLowerCase().includes('lockscreen'));

      if (!targetFile) {
        console.warn(
          '[withLockScreenWidget] Could not find LockScreenPrioritiesWidget XML.',
          'Files available:', allFiles.join(', ')
        );
        return config;
      }

      const filePath = path.join(xmlDir, targetFile);
      const content = fs.readFileSync(filePath, 'utf8');

      if (content.includes('widgetCategory')) {
        console.log('[withLockScreenWidget] Already patched:', targetFile);
        return config;
      }

      const patched = content.replace(
        '<appwidget-provider',
        '<appwidget-provider\n    android:widgetCategory="keyguard|home_screen"'
      );

      fs.writeFileSync(filePath, patched, 'utf8');
      console.log('[withLockScreenWidget] Patched', targetFile, 'with widgetCategory="keyguard|home_screen"');

      return config;
    },
  ]);
}

module.exports = withLockScreenWidget;
