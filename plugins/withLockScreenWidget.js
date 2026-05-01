/**
 * Expo config plugin for LockScreenPrioritiesWidget.
 *
 * Fixes two issues in react-native-android-widget:
 *
 * 1. android:exported="false" on the receiver — Android 12+ requires
 *    AppWidget providers to be exported=true or the system widget picker
 *    (both home screen and Samsung lock screen) will not list the widget.
 *
 * 2. android:widgetCategory="home_screen" — must be changed to "keyguard" so
 *    the widget appears ONLY in the Samsung lock screen widget panel and not
 *    as an extra entry in the home screen widget picker. Patched directly via
 *    withDangerousMod at prebuild time.
 */

const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const WIDGET_RECEIVER_NAME = 'LockScreenPrioritiesWidget';
const XML_FILENAME = 'widgetprovider_lockscreenprioritieswidget.xml';

function withLockScreenWidget(config) {
  // Fix 1: set android:exported="true" on the LockScreenPrioritiesWidget receiver.
  // The library hardcodes exported="false" which prevents Android 12+ from listing
  // the widget in any widget picker (home screen or lock screen).
  config = withAndroidManifest(config, (config) => {
    const mainApp = config.modResults.manifest.application?.[0];
    if (!mainApp?.receiver) return config;

    for (const receiver of mainApp.receiver) {
      const name = receiver.$?.['android:name'] ?? '';
      if (name.includes(WIDGET_RECEIVER_NAME)) {
        receiver.$['android:exported'] = 'true';
        console.log('[withLockScreenWidget] Set exported=true on receiver:', name);
      }
    }
    return config;
  });

  // Fix 2: patch widgetCategory directly in the provider XML at prebuild time
  // using withDangerousMod so it runs after react-native-android-widget writes
  // the file, and before the native build starts.
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      const xmlPath = path.join(projectRoot, 'app', 'src', 'main', 'res', 'xml', XML_FILENAME);

      if (fs.existsSync(xmlPath)) {
        let content = fs.readFileSync(xmlPath, 'utf8');
        // Set widgetCategory to "keyguard" only — this removes it from the home
        // screen widget picker and makes it appear exclusively in the lock screen
        // widget panel (Samsung One UI 5+).
        if (!content.includes('android:widgetCategory="keyguard"')) {
          content = content.replace(
            /android:widgetCategory="[^"]*"/,
            'android:widgetCategory="keyguard"'
          );
          fs.writeFileSync(xmlPath, content, 'utf8');
          console.log('[withLockScreenWidget] Patched widgetCategory to keyguard');
        } else {
          console.log('[withLockScreenWidget] widgetCategory already set to keyguard');
        }
      } else {
        console.warn('[withLockScreenWidget] XML not found at:', xmlPath);
      }

      return config;
    },
  ]);

  return config;
}

module.exports = withLockScreenWidget;
