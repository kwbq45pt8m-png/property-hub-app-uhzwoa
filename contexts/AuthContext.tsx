
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { authClient, setBearerToken, clearAuthTokens } from "@/lib/auth";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function openOAuthPopup(provider: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const popupUrl = `${window.location.origin}/auth-popup?provider=${provider}`;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      popupUrl,
      "oauth-popup",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popup) {
      reject(new Error("Failed to open popup. Please allow popups."));
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "oauth-success" && event.data?.token) {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        resolve(event.data.token);
      } else if (event.data?.type === "oauth-error") {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        reject(new Error(event.data.error || "OAuth failed"));
      }
    };

    window.addEventListener("message", handleMessage);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        reject(new Error("Authentication cancelled"));
      }
    }, 500);
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();

    // Listen for deep links (e.g. from social auth redirects)
    const subscription = Linking.addEventListener("url", (event) => {
      console.log("Deep link received, refreshing user session");
      // Allow time for the client to process the token if needed
      setTimeout(() => fetchUser(), 500);
    });

    // POLLING: Refresh session every 5 minutes to keep SecureStore token in sync
    // This prevents 401 errors when the session token rotates
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing user session to sync token...");
      fetchUser();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      console.log("Fetching user session...");
      const session = await authClient.getSession();
      console.log("Session result:", session);
      
      if (session?.data?.user) {
        console.log("User authenticated:", session.data.user.email);
        setUser(session.data.user as User);
        // Sync token to SecureStore for utils/api.ts
        if (session.data.session?.token) {
          console.log("Saving bearer token to storage");
          await setBearerToken(session.data.session.token);
        }
      } else {
        console.log("No active session found");
        setUser(null);
        await clearAuthTokens();
      }
    } catch (error: any) {
      console.error("Failed to fetch user:", error);
      console.error("Fetch user error details:", {
        message: error.message,
        status: error.status,
      });
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log("Starting email sign-in...", { email });
      const result = await authClient.signIn.email({ email, password });
      console.log("Email sign-in result:", result);
      
      // Check if the result indicates an error
      if (result?.error) {
        console.error("Sign-in returned error:", result.error);
        const errorMessage = result.error.message || "Invalid email or password";
        throw new Error(errorMessage);
      }
      
      await fetchUser();
      console.log("Email sign-in completed successfully");
    } catch (error: any) {
      console.error("Email sign in failed:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        response: error.response,
      });
      
      // Create a user-friendly error message
      let errorMessage = "Invalid email or password. Please try again.";
      
      if (error.message) {
        // If the error already has a message, check if it's user-friendly
        if (error.message.includes("Invalid") || error.message.includes("invalid")) {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your internet connection.";
        } else if (error.message !== "Invalid email or password. Please try again.") {
          // Use the original message if it's not the default
          errorMessage = error.message;
        }
      }
      
      // Check status code
      if (error.status === 400 || error.status === 401) {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      }
      
      // Create a new error with the friendly message and preserve the status
      const friendlyError: any = new Error(errorMessage);
      friendlyError.status = error.status;
      throw friendlyError;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      console.log("Starting email sign-up...", { email, name });
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });
      console.log("Email sign-up result:", result);
      
      // Check if the result indicates an error
      if (result?.error) {
        console.error("Sign-up returned error:", result.error);
        const errorMessage = result.error.message || "Unable to create account";
        throw new Error(errorMessage);
      }
      
      await fetchUser();
      console.log("Email sign-up completed successfully");
    } catch (error: any) {
      console.error("Email sign up failed:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        response: error.response,
      });
      
      // Create a user-friendly error message
      let errorMessage = "Unable to create account. Please try again.";
      
      if (error.message) {
        if (error.message.includes("already") || error.message.includes("exists")) {
          errorMessage = "This email is already registered. Please sign in instead.";
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your internet connection.";
        } else if (error.message !== "Unable to create account. Please try again.") {
          errorMessage = error.message;
        }
      }
      
      // Check status code
      if (error.status === 400) {
        errorMessage = "Unable to create account. Please check your information and try again.";
      } else if (error.status === 409) {
        errorMessage = "This email is already registered. Please sign in instead.";
      }
      
      // Create a new error with the friendly message and preserve the status
      const friendlyError: any = new Error(errorMessage);
      friendlyError.status = error.status;
      throw friendlyError;
    }
  };

  const signInWithSocial = async (provider: "google" | "apple" | "github") => {
    try {
      console.log(`Starting ${provider} sign-in flow...`);
      
      if (Platform.OS === "web") {
        console.log(`Opening ${provider} OAuth popup...`);
        const token = await openOAuthPopup(provider);
        console.log(`${provider} OAuth popup returned token, setting bearer token...`);
        await setBearerToken(token);
        console.log(`Fetching user session after ${provider} sign-in...`);
        await fetchUser();
        console.log(`${provider} sign-in completed successfully`);
      } else {
        // Native: Use expo-linking to generate a proper deep link
        const callbackURL = Linking.createURL("/auth-callback");
        console.log(`Native ${provider} sign-in with callback URL: ${callbackURL}`);
        
        await authClient.signIn.social({
          provider,
          callbackURL,
        });
        
        console.log(`${provider} sign-in initiated, waiting for callback...`);
        // Note: The redirect will reload the app or be handled by deep linking.
        // fetchUser will be called on mount or via event listener.
        await fetchUser();
      }
    } catch (error: any) {
      console.error(`${provider} sign in failed:`, error);
      
      // Provide more helpful error messages
      let errorMessage = error.message || "Authentication failed";
      
      if (errorMessage.includes("500")) {
        errorMessage = `${provider} sign-in is temporarily unavailable. The authentication server encountered an error. Please try again in a moment.`;
      } else if (errorMessage.includes("cancelled")) {
        errorMessage = "Sign-in was cancelled";
      } else if (errorMessage.includes("popup")) {
        errorMessage = "Please allow popups to sign in with " + provider;
      }
      
      // Create a new error with the friendly message
      const friendlyError = new Error(errorMessage);
      throw friendlyError;
    }
  };

  const signInWithGoogle = () => signInWithSocial("google");
  const signInWithApple = () => signInWithSocial("apple");
  const signInWithGitHub = () => signInWithSocial("github");

  const signOut = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error("Sign out failed (API):", error);
    } finally {
       // Always clear local state
       setUser(null);
       await clearAuthTokens();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signInWithGitHub,
        signOut,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
