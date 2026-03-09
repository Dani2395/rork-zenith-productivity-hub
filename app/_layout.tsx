import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { DataProvider } from "@/contexts/DataContext";
import Colors from "@/constants/colors";
import { registerForPushNotificationsAsync } from "@/utils/notifications";

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
        name="test"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          title: "Test",
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
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <DataProvider>
          <StatusBar style="light" />
          <RootLayoutNav />
        </DataProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
