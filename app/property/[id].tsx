
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ImageSourcePropType,
  Dimensions,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { useAuth } from "@/contexts/AuthContext";
import { authenticatedGet } from "@/utils/api";
import AdModal from "@/components/AdModal";

const { width } = Dimensions.get('window');

// Helper to resolve image sources
function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

interface Property {
  id: string;
  title: string;
  description: string;
  price: string;
  size: number;
  district: string;
  equipment: string;
  photos: string[];
  virtualTourUrl?: string;
  ownerId: string;
  createdAt: string;
}

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showAdModal, setShowAdModal] = useState(false);
  
  // Always call useVideoPlayer unconditionally, but with a fallback URL
  const videoPlayer = useVideoPlayer(property?.virtualTourUrl || '', (player) => {
    player.loop = false;
    player.muted = false;
  });

  const loadProperty = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching property from:", `/api/properties/${id}`);
      const data = await authenticatedGet<Property>(`/api/properties/${id}`);
      console.log("Property loaded:", data);
      setProperty(data);
    } catch (error) {
      console.error("Error loading property:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    console.log("Loading property details for ID:", id);
    loadProperty();
  }, [id, loadProperty]);

  const handleStartChatClick = () => {
    console.log("User tapped Contact Owner button - showing ad first");
    setShowAdModal(true);
  };

  const handleAdComplete = () => {
    console.log("Ad completed - proceeding to start chat");
    setShowAdModal(false);
    handleStartChat();
  };

  const handleStartChat = async () => {
    if (!property) return;
    
    console.log("Starting chat for property:", property.id);
    try {
      const response = await authenticatedGet<{ chatId: string }>(`/api/chats/${property.id}/start`);
      console.log("Chat started:", response.chatId);
      router.push(`/chat/${response.chatId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const handlePlayVideo = () => {
    if (videoPlayer) {
      if (videoPlayer.playing) {
        videoPlayer.pause();
      } else {
        videoPlayer.play();
      }
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  if (!property) {
    return (
      <>
        <Stack.Screen options={{ title: 'Property Not Found' }} />
        <View style={styles.errorContainer}>
          <IconSymbol 
            ios_icon_name="exclamationmark.triangle" 
            android_material_icon_name="error" 
            size={64} 
            color={colors.error} 
          />
          <Text style={styles.errorText}>Property not found</Text>
        </View>
      </>
    );
  }

  const photos = property.photos && property.photos.length > 0 
    ? property.photos 
    : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'];
  
  const equipmentList = property.equipment ? property.equipment.split(',').map(e => e.trim()) : [];
  const priceText = `HK$${property.price}`;
  const sizeText = `${property.size} sq ft`;
  const isOwner = user?.id === property.ownerId;
  const hasVirtualTour = !!property.virtualTourUrl;

  return (
    <>
      <Stack.Screen options={{ title: property.title }} />
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Photo Gallery */}
          <View style={styles.photoGallery}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                setCurrentPhotoIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {photos.map((photo, index) => (
                <Image
                  key={index}
                  source={resolveImageSource(photo)}
                  style={styles.photo}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            <View style={styles.photoIndicator}>
              <Text style={styles.photoIndicatorText}>
                {currentPhotoIndex + 1}
              </Text>
              <Text style={styles.photoIndicatorSeparator}>/</Text>
              <Text style={styles.photoIndicatorText}>
                {photos.length}
              </Text>
            </View>
          </View>

          {/* Property Info */}
          <View style={styles.content}>
            <Text style={styles.title}>{property.title}</Text>
            
            <View style={styles.locationRow}>
              <IconSymbol 
                ios_icon_name="location" 
                android_material_icon_name="location-on" 
                size={20} 
                color={colors.textSecondary} 
              />
              <Text style={styles.district}>{property.district}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{priceText}</Text>
                <Text style={styles.statLabel}>Monthly Rent</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{sizeText}</Text>
                <Text style={styles.statLabel}>Size</Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{property.description}</Text>
            </View>

            {/* Equipment */}
            {equipmentList.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Equipment & Amenities</Text>
                <View style={styles.equipmentList}>
                  {equipmentList.map((item, index) => (
                    <View key={index} style={styles.equipmentItem}>
                      <IconSymbol 
                        ios_icon_name="checkmark.circle.fill" 
                        android_material_icon_name="check-circle" 
                        size={20} 
                        color={colors.success} 
                      />
                      <Text style={styles.equipmentText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Virtual Tour Video */}
            {hasVirtualTour && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Virtual Tour</Text>
                <View style={styles.videoContainer}>
                  <VideoView
                    player={videoPlayer}
                    style={styles.video}
                    nativeControls
                    contentFit="contain"
                  />
                  {!videoPlayer.playing && (
                    <TouchableOpacity
                      style={styles.videoPlayButton}
                      onPress={handlePlayVideo}
                    >
                      <IconSymbol 
                        ios_icon_name="play.circle.fill" 
                        android_material_icon_name="play-circle-filled" 
                        size={64} 
                        color="#FFFFFF" 
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <View style={styles.bottomPadding} />
          </View>
        </ScrollView>

        {/* Contact Button - Fixed at bottom */}
        {!isOwner && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleStartChatClick}
            >
              <IconSymbol 
                ios_icon_name="message.fill" 
                android_material_icon_name="message" 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.contactButtonText}>Contact Owner</Text>
            </TouchableOpacity>
          </View>
        )}

        <AdModal isVisible={showAdModal} onAdComplete={handleAdComplete} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  photoGallery: {
    height: 300,
    position: 'relative',
  },
  photo: {
    width: width,
    height: 300,
    backgroundColor: colors.backgroundAlt,
  },
  photoIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoIndicatorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  photoIndicatorSeparator: {
    color: '#FFFFFF',
    fontSize: 14,
    marginHorizontal: 4,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  district: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  equipmentList: {
    gap: 12,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  equipmentText: {
    fontSize: 16,
    color: colors.text,
  },
  videoContainer: {
    width: '100%',
    height: 250,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -32 }, { translateY: -32 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 32,
  },
  bottomPadding: {
    height: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  contactButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
