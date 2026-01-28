
import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, View, ActivityIndicator } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
// Note: Error logging is auto-initialized via index.ts import

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)", // Ensure any route can link back to `/`
};

/**
 * Auth Bootstrap Component
 * Implements the AUTH BOOTSTRAP RULE to prevent redirect loops
 * - Shows loading screen while checking authentication
 * - Redirects to auth screen if not authenticated
 * - Redirects to app if authenticated
 */
function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      console.log("[AuthBootstrap] Still loading authentication state...");
      return;
    }

    const inAuthGroup = segments[0] === "auth" || segments[0] === "auth-popup" || segments[0] === "auth-callback";
    
    console.log("[AuthBootstrap] Auth state:", { 
      user: user?.email, 
      loading, 
      inAuthGroup,
      currentSegments: segments 
    });

    if (!user && !inAuthGroup) {
      // User is not authenticated and not in auth screens - redirect to auth
      console.log("[AuthBootstrap] User not authenticated, redirecting to /auth");
      router.replace("/auth");
    } else if (user && inAuthGroup) {
      // User is authenticated but still in auth screens - redirect to app
      console.log("[AuthBootstrap] User authenticated, redirecting to /(tabs)");
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      console.log("⚠️ Network offline - app will work in offline mode");
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "rgb(0, 122, 255)", // System Blue
      background: "rgb(242, 242, 247)", // Light mode background
      card: "rgb(255, 255, 255)", // White cards/surfaces
      text: "rgb(0, 0, 0)", // Black text for light mode
      border: "rgb(216, 216, 220)", // Light gray for separators/borders
      notification: "rgb(255, 59, 48)", // System Red
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "rgb(10, 132, 255)", // System Blue (Dark Mode)
      background: "rgb(1, 1, 1)", // True black background for OLED displays
      card: "rgb(28, 28, 30)", // Dark card/surface color
      text: "rgb(255, 255, 255)", // White text for dark mode
      border: "rgb(44, 44, 46)", // Dark gray for separators/borders
      notification: "rgb(255, 69, 58)", // System Red (Dark Mode)
    },
  };

  return (
    <>
      <StatusBar style="auto" animated />
      <ThemeProvider
        value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
      >
        <AuthBootstrap>
          <Stack>
            {/* Auth screens */}
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="auth-popup" options={{ headerShown: false }} />
            <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
            
            {/* Main app with tabs */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            
            {/* Chat screen - outside tabs to avoid FloatingTabBar blocking input */}
            <Stack.Screen 
              name="chat/[id]" 
              options={{ 
                headerShown: true,
                title: 'Chat',
                headerBackTitle: 'Back'
              }} 
            />
            
            {/* Property detail screen */}
            <Stack.Screen 
              name="property/[id]" 
              options={{ 
                headerShown: true,
                title: 'Property Details',
                headerBackTitle: 'Back'
              }} 
            />
          </Stack>
          <SystemBars style={"auto"} />
        </AuthBootstrap>
      </ThemeProvider>
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <AuthProvider>
          <WidgetProvider>
            <RootLayoutContent />
          </WidgetProvider>
        </AuthProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
