/**
 * Expo config plugin — patches widgetprovider_lockscreenprioritieswidget.xml
 * to add android:widgetCategory="keyguard|home_screen" for Samsung lock screen.
 *
 * react-native-android-widget writes the XML using:
 *   path.join(platformProjectRoot, 'android/app/src/main/res/xml', filename)
 * where platformProjectRoot = {projectRoot}/android (Expo SDK 50+).
 * This produces a double-android path: {projectRoot}/android/android/app/src/main/res/xml/
 * We search BOTH the correct path and the library's path so the patch always lands.
 *
 * We use withAppBuildGradle so the patch runs during the Gradle build phase,
 * which is guaranteed to run after expo prebuild has written all generated files.
 */

const { withAppBuildGradle } = require('@expo/config-plugins');

const GRADLE_SNIPPET = `
// Patch LockScreenPrioritiesWidget for Samsung lock screen widget picker.
afterEvaluate {
    def patchLockScreenWidget = tasks.create("patchLockScreenWidget") {
        doLast {
            def filename = "widgetprovider_lockscreenprioritieswidget.xml"
            // Candidate 1: correct location (relative to android/app/)
            // Candidate 2: library double-android bug location (relative to android/app/)
            // rootProject.projectDir = android/, so:
            //   rootProject.file("android/app/src/...") = android/android/app/src/...
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
                    println "[withLockScreenWidget] PATCHED: " + target.absolutePath
                } else {
                    println "[withLockScreenWidget] already has keyguard: " + target.absolutePath
                }
            } else {
                println "[withLockScreenWidget] FILE NOT FOUND — searched:"
                candidates.each { println "  " + it.absolutePath }
            }
        }
    }
    preBuild.dependsOn patchLockScreenWidget
}
`;

function withLockScreenWidget(config) {
  return withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('patchLockScreenWidget')) {
      config.modResults.contents += GRADLE_SNIPPET;
    }
    return config;
  });
}

module.exports = withLockScreenWidget;
