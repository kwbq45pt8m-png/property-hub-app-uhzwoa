
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { useAuth } from "@/contexts/AuthContext";
import { authenticatedGet } from "@/utils/api";
import AdModal from "@/components/AdModal";

interface Chat {
  id: string;
  propertyId: string;
  property?: {
    title: string;
    photos: string[];
  };
  renterId: string;
  renteeId: string;
  lastMessage: string;
  lastMessageAt: string;
}

export default function ChatsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdModal, setShowAdModal] = useState(false);

  useEffect(() => {
    console.log("ChatsScreen mounted - showing ad before loading chats");
    if (user) {
      setShowAdModal(true);
    }
  }, [user]);

  const handleAdComplete = () => {
    console.log("Ad completed - loading chats");
    setShowAdModal(false);
    loadChats();
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      console.log("Fetching chats from:", "/api/chats");
      const data = await authenticatedGet<Chat[]>("/api/chats");
      console.log("Chats loaded:", data.length);
      setChats(data);
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatPress = (chatId: string) => {
    console.log("Opening chat:", chatId);
    router.push(`/chat/${chatId}`);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) {
      const minsText = `${diffMins}m ago`;
      return minsText;
    }
    if (diffHours < 24) {
      const hoursText = `${diffHours}h ago`;
      return hoursText;
    }
    if (diffDays < 7) {
      const daysText = `${diffDays}d ago`;
      return daysText;
    }
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateText = `${month}/${day}`;
    return dateText;
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
      </View>

      {/* Chats List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol 
            ios_icon_name="message" 
            android_material_icon_name="message" 
            size={64} 
            color={colors.textSecondary} 
          />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>Start chatting with property owners</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.chatsList}
          showsVerticalScrollIndicator={false}
        >
          {chats.map((chat) => {
            const propertyTitle = chat.property?.title || 'Property';
            const lastMessage = chat.lastMessage || 'No messages yet';
            const timeText = chat.lastMessageAt ? formatTime(chat.lastMessageAt) : '';
            
            return (
              <TouchableOpacity
                key={chat.id}
                style={styles.chatCard}
                onPress={() => handleChatPress(chat.id)}
                activeOpacity={0.7}
              >
                <View style={styles.chatIcon}>
                  <IconSymbol 
                    ios_icon_name="house.fill" 
                    android_material_icon_name="home" 
                    size={24} 
                    color={colors.primary} 
                  />
                </View>
                <View style={styles.chatInfo}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.chatTitle} numberOfLines={1}>
                      {propertyTitle}
                    </Text>
                    <Text style={styles.chatTime}>{timeText}</Text>
                  </View>
                  <Text style={styles.chatMessage} numberOfLines={1}>
                    {lastMessage}
                  </Text>
                </View>
                <IconSymbol 
                  ios_icon_name="chevron.right" 
                  android_material_icon_name="chevron-right" 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            );
          })}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      <AdModal isVisible={showAdModal} onAdComplete={handleAdComplete} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  chatsList: {
    flex: 1,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  chatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chatMessage: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bottomPadding: {
    height: 100,
  },
});
