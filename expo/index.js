// Register the Android widget task handler FIRST, before the app loads.
// This is required for headless task support: when Android needs to update
// a widget, it starts a separate JS process that never loads app/_layout.tsx.
// Registering here ensures the handler is always available.
import './widgets/widgetTaskHandler';

// Load expo-router entry point
import 'expo-router/entry';
