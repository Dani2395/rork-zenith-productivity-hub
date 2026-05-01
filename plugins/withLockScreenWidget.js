/**
 * Expo config plugin for LockScreenPrioritiesWidget.
 *
 * Fixes two bugs in react-native-android-widget@0.20.1:
 *
 * 1. android:exported="false" on the receiver — Android 12+ requires
 *    AppWidget providers to be exported=true or the system widget picker
 *    (both home screen and Samsung lock screen) will not list the widget.
 *    Fixed via withAndroidManifest.
 *
 * 2. android:widgetCategory="home_screen" — Samsung One UI 5+ requires
 *    "keyguard" in widgetCategory for a widget to appear in the lock screen
 *    widget panel. Fixed via a Gradle task that runs after expo prebuild.
 */

const { withAppBuildGradle, withAndroidManifest } = require('@expo/config-plugins');

const WIDGET_RECEIVER_NAME = 'LockScreenPrioritiesWidget';

const GRADLE_SNIPPET = `
// Patch LockScreenPrioritiesWidget widgetCategory for Samsung lock screen.
afterEvaluate {
    def patchLockScreenWidget = tasks.create("patchLockScreenWidget") {
        doLast {
            def filename = "widgetprovider_lockscreenprioritieswidget.xml"
            def candidates = [
                file("src/main/res/xml/" + filename),
                rootProject.file("android/app/src/main/res/xml/" + filename),
            ]
            def target = candidates.find { it.exists() }
            if (target != null) {
                def content = target.text
                if (!content.contains("keyguard")) {
                    target.text = content.replace(
                        'android:widgetCategory="home_screen"',
                        'android:widgetCategory="keyguard|home_screen"'
                    )
                    println "[withLockScreenWidget] PATCHED widgetCategory: " + target.absolutePath
                } else {
                    println "[withLockScreenWidget] widgetCategory already has keyguard"
                }
            } else {
                println "[withLockScreenWidget] ERROR: XML file not found"
                candidates.each { println "  checked: " + it.absolutePath }
            }
        }
    }
    preBuild.dependsOn patchLockScreenWidget
}
`;

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

  // Fix 2: patch widgetCategory in the provider XML via a Gradle task.
  config = withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('patchLockScreenWidget')) {
      config.modResults.contents += GRADLE_SNIPPET;
    }
    return config;
  });

  return config;
}

module.exports = withLockScreenWidget;
