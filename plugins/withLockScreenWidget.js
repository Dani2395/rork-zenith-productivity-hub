/**
 * Expo config plugin — changes android:widgetCategory from "home_screen"
 * to "keyguard|home_screen" for the LockScreenPrioritiesWidget.
 *
 * react-native-android-widget writes widgetCategory="home_screen" by default.
 * Samsung One UI 5+ uses this attribute to decide which widgets appear in
 * the lock screen widget picker — "keyguard" must be present for the widget
 * to show there.
 *
 * Generated filename: widgetprovider_{lowercasedname}.xml
 * e.g. LockScreenPrioritiesWidget → widgetprovider_lockscreenprioritieswidget.xml
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

      // react-native-android-widget names files: widgetprovider_{lowercasedname}.xml
      const targetFile = 'widgetprovider_lockscreenprioritieswidget.xml';
      const filePath = path.join(xmlDir, targetFile);

      if (!fs.existsSync(filePath)) {
        console.warn('[withLockScreenWidget] File not found:', targetFile);
        console.warn('[withLockScreenWidget] Files in xml dir:', fs.readdirSync(xmlDir).join(', '));
        return config;
      }

      const content = fs.readFileSync(filePath, 'utf8');

      if (content.includes('keyguard')) {
        console.log('[withLockScreenWidget] Already has keyguard, skipping.');
        return config;
      }

      // Replace home_screen → keyguard|home_screen (library always writes home_screen)
      const patched = content.replace(
        'android:widgetCategory="home_screen"',
        'android:widgetCategory="keyguard|home_screen"'
      );

      fs.writeFileSync(filePath, patched, 'utf8');
      console.log('[withLockScreenWidget] Patched', targetFile, '— widgetCategory set to keyguard|home_screen');

      return config;
    },
  ]);
}

module.exports = withLockScreenWidget;
