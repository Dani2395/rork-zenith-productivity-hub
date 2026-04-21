import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, Component } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { View, Text, ScrollView } from "react-native";
import { DataProvider } from "@/contexts/DataContext";
import Colors from "@/constants/colors";
import { registerForPushNotificationsAsync } from "@/utils/notifications";

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#0f0f0f', padding: 20 }}>
          <Text style={{ color: '#ff4444', fontSize: 18, fontWeight: 'bold', marginTop: 40 }}>App Error</Text>
          <Text style={{ color: '#ffffff', marginTop: 12, fontSize: 14 }}>{err.message}</Text>
          <Text style={{ color: '#888', marginTop: 12, fontSize: 11 }}>{err.stack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="onboarding"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          title: 'Settings',
        }}
      />
      <Stack.Screen 
        name="tasks" 
        options={{ 
          headerShown: true,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          title: "Tasks",
        }} 
      />
      <Stack.Screen 
        name="notes" 
        options={{ 
          headerShown: true,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          title: "Notes",
        }} 
      />
      <Stack.Screen 
        name="calendar" 
        options={{ 
          headerShown: true,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          title: "Calendar",
        }} 
      />
      <Stack.Screen 
        name="habits" 
        options={{ 
          headerShown: true,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          title: "Habits",
        }} 
      />
      <Stack.Screen 
        name="workout" 
        options={{ 
          headerShown: true,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          title: "Workout",
        }} 
      />
      <Stack.Screen 
        name="books" 
        options={{ 
          headerShown: true,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          title: "Books",
        }} 
      />
      <Stack.Screen 
        name="budget" 
        options={{ 
          headerShown: true,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          title: "Budget",
        }} 
      />
      <Stack.Screen 
        name="gifts" 
        options={{ 
          headerShown: true,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          title: "Gifts",
        }} 
      />
      <Stack.Screen
        name="bingo"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          title: "2026 Bingo",
        }}
      />
      <Stack.Screen
        name="brain-dump"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="voice-add"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
    registerForPushNotificationsAsync();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <DataProvider>
            <StatusBar style="light" />
            <RootLayoutNav />
          </DataProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
