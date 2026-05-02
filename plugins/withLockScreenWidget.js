/**
 * Expo config plugin for LockScreenPrioritiesWidget.
 *
 * Two fixes applied:
 *
 * 1. android:exported="false" on the receiver — Android 12+ requires
 *    AppWidget providers to be exported=true or the system widget picker
 *    will not list the widget.
 *
 * 2. android:widgetCategory must be "keyguard" so the widget appears in
 *    the Samsung lock screen widget panel instead of the home screen picker.
 *    We search the entire res/xml directory for the generated provider file,
 *    patch it in place, AND add a Gradle task as a build-time backup.
 */

const { withAndroidManifest, withDangerousMod, withAppBuildGradle } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const WIDGET_NAME = 'LockScreenPrioritiesWidget';
const WIDGET_NAME_LOWER = WIDGET_NAME.toLowerCase();

// Complete provider XML written when the file can't be found to patch.
const PROVIDER_XML = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="180dp"
    android:minHeight="110dp"
    android:targetCellWidth="4"
    android:targetCellHeight="2"
    android:updatePeriodMillis="1800000"
    android:resizeMode="horizontal|vertical"
    android:widgetFeatures="reconfigurable|configuration_optional"
    android:widgetCategory="keyguard"
    android:initialLayout="@layout/rn_widget_empty_view" />
`;

// Gradle task as a build-time backup in case the prebuild patch misses.
const GRADLE_SNIPPET = `
// Patch LockScreenPrioritiesWidget widgetCategory for Samsung lock screen.
afterEvaluate {
    def patchLockScreenWidget = tasks.create("patchLockScreenWidget") {
        doLast {
            def xmlDir = file("src/main/res/xml")
            if (xmlDir.exists()) {
                xmlDir.listFiles().each { f ->
                    if (f.name.toLowerCase().contains("lockscreen") || f.name.toLowerCase().contains("lock_screen")) {
                        def content = f.text
                        if (content.contains('android:widgetCategory')) {
                            f.text = content.replaceAll('android:widgetCategory="[^"]*"', 'android:widgetCategory="keyguard"')
                            println "[withLockScreenWidget] Gradle patched: " + f.name
                        }
                    }
                }
            }
        }
    }
    preBuild.dependsOn patchLockScreenWidget
}
`;

function withLockScreenWidget(config) {
  // Fix 1: set android:exported="true" on the receiver.
  config = withAndroidManifest(config, (config) => {
    const mainApp = config.modResults.manifest.application?.[0];
    if (!mainApp?.receiver) return config;
    for (const receiver of mainApp.receiver) {
      const name = receiver.$?.['android:name'] ?? '';
      if (name.toLowerCase().includes(WIDGET_NAME_LOWER)) {
        receiver.$['android:exported'] = 'true';
        console.log('[withLockScreenWidget] Set exported=true on:', name);
      }
    }
    return config;
  });

  // Fix 2a: patch at prebuild time via withDangerousMod.
  // Search the entire res/xml directory for any file whose name contains
  // "lockscreen" or "lockscreenpriorities" (case-insensitive).
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const root = config.modRequest.platformProjectRoot;
      const xmlDir = path.join(root, 'app', 'src', 'main', 'res', 'xml');

      if (!fs.existsSync(xmlDir)) {
        console.warn('[withLockScreenWidget] res/xml dir not found:', xmlDir);
        return config;
      }

      const files = fs.readdirSync(xmlDir);
      const match = files.find(f =>
        f.toLowerCase().includes('lockscreen') ||
        f.toLowerCase().includes('lock_screen') ||
        f.toLowerCase().includes(WIDGET_NAME_LOWER)
      );

      if (match) {
        const xmlPath = path.join(xmlDir, match);
        let content = fs.readFileSync(xmlPath, 'utf8');

        if (content.includes('android:widgetCategory')) {
          content = content.replace(
            /android:widgetCategory="[^"]*"/,
            'android:widgetCategory="keyguard"'
          );
        } else {
          // Attribute missing — inject it before the closing tag
          content = content.replace(
            /(android:initialLayout|\/\s*>)/,
            'android:widgetCategory="keyguard"\n    $1'
          );
        }

        fs.writeFileSync(xmlPath, content, 'utf8');
        console.log('[withLockScreenWidget] Prebuild patched widgetCategory in:', match);
      } else {
        // File not generated yet — write it from scratch so Gradle sees it.
        const fallbackPath = path.join(xmlDir, `widgetprovider_${WIDGET_NAME_LOWER}.xml`);
        fs.writeFileSync(fallbackPath, PROVIDER_XML, 'utf8');
        console.log('[withLockScreenWidget] Wrote provider XML from scratch:', fallbackPath);
      }

      return config;
    },
  ]);

  // Fix 2b: Gradle task as a build-time safety net.
  config = withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('patchLockScreenWidget')) {
      config.modResults.contents += GRADLE_SNIPPET;
    }
    return config;
  });

  return config;
}

module.exports = withLockScreenWidget;
