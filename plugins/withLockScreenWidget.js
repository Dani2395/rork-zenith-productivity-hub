/**
 * Expo config plugin — patches widgetprovider_lockscreenprioritieswidget.xml
 * to add android:widgetCategory="keyguard|home_screen" so the widget appears
 * in Samsung One UI 5+ lock screen widget picker.
 *
 * WHY a Gradle task instead of withDangerousMod:
 * react-native-android-widget also uses withDangerousMod to generate the XML.
 * If our mod runs first the file doesn't exist yet; if it runs second it works.
 * Ordering is non-deterministic across Expo SDK versions, so this approach
 * patches the file inside the Gradle build phase, which always runs after
 * expo prebuild has written every generated file.
 */

const { withAppBuildGradle } = require('@expo/config-plugins');

const GRADLE_TASK = `
// Patch LockScreenPrioritiesWidget to appear in Samsung lock screen picker.
task patchLockScreenWidget {
    doFirst {
        def xmlFile = file("src/main/res/xml/widgetprovider_lockscreenprioritieswidget.xml")
        if (xmlFile.exists()) {
            def txt = xmlFile.text
            if (!txt.contains('keyguard')) {
                xmlFile.text = txt.replace(
                    'android:widgetCategory="home_screen"',
                    'android:widgetCategory="keyguard|home_screen"'
                )
                println "[withLockScreenWidget] patched " + xmlFile.absolutePath
            } else {
                println "[withLockScreenWidget] already patched"
            }
        } else {
            println "[withLockScreenWidget] FILE NOT FOUND: " + xmlFile.absolutePath
        }
    }
}
preBuild.dependsOn patchLockScreenWidget
`;

function withLockScreenWidget(config) {
  return withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('patchLockScreenWidget')) {
      config.modResults.contents += GRADLE_TASK;
    }
    return config;
  });
}

module.exports = withLockScreenWidget;
