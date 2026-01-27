
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { useAuth } from "@/contexts/AuthContext";
import { authenticatedGet } from "@/utils/api";

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

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  
  const [myListings, setMyListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  useEffect(() => {
    console.log("ProfileScreen mounted - loading user data");
    if (user) {
      loadMyListings();
    }
  }, [user]);

  const loadMyListings = async () => {
    try {
      setLoading(true);
      console.log("Fetching user listings from:", "/api/my-listings");
      const data = await authenticatedGet<Property[]>("/api/my-listings");
      console.log("User listings loaded:", data.length);
      setMyListings(data);
    } catch (error) {
      console.error("Error loading user listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    console.log("User signing out");
    setShowSignOutModal(false);
    try {
      await signOut();
      router.replace("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handlePropertyPress = (propertyId: string) => {
    console.log("Opening property:", propertyId);
    router.push(`/property/${propertyId}`);
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

  const userName = user.name || user.email || 'User';
  const userEmail = user.email || '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <IconSymbol 
              ios_icon_name="person.fill" 
              android_material_icon_name="person" 
              size={32} 
              color="#FFFFFF" 
            />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userEmail}>{userEmail}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => setShowSignOutModal(true)}
        >
          <IconSymbol 
            ios_icon_name="rectangle.portrait.and.arrow.right" 
            android_material_icon_name="logout" 
            size={20} 
            color={colors.error} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Listed Properties Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Listed Properties</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : myListings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol 
                ios_icon_name="house" 
                android_material_icon_name="home" 
                size={64} 
                color={colors.textSecondary} 
              />
              <Text style={styles.emptyText}>No properties listed yet</Text>
              <Text style={styles.emptySubtext}>Start listing your properties to rent</Text>
              <TouchableOpacity
                style={styles.listButton}
                onPress={() => router.push("/list-property")}
              >
                <IconSymbol 
                  ios_icon_name="plus" 
                  android_material_icon_name="add" 
                  size={20} 
                  color="#FFFFFF" 
                />
                <Text style={styles.listButtonText}>List Property</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.propertiesGrid}>
              {myListings.map((property) => {
                const firstPhoto = property.photos && property.photos.length > 0 ? property.photos[0] : '';
                const priceText = `HK$${property.price}`;
                const sizeText = `${property.size} sq ft`;
                
                return (
                  <TouchableOpacity
                    key={property.id}
                    style={styles.propertyCard}
                    onPress={() => handlePropertyPress(property.id)}
                    activeOpacity={0.7}
                  >
                    {firstPhoto ? (
                      <Image
                        source={resolveImageSource(firstPhoto)}
                        style={styles.propertyImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.propertyImagePlaceholder}>
                        <IconSymbol 
                          ios_icon_name="house.fill" 
                          android_material_icon_name="home" 
                          size={40} 
                          color={colors.textSecondary} 
                        />
                      </View>
                    )}
                    <View style={styles.propertyInfo}>
                      <Text style={styles.propertyTitle} numberOfLines={1}>
                        {property.title}
                      </Text>
                      <Text style={styles.propertyDistrict} numberOfLines={1}>
                        {property.district}
                      </Text>
                      <View style={styles.propertyDetails}>
                        <Text style={styles.propertyPrice}>{priceText}</Text>
                        <Text style={styles.propertySize}>{sizeText}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Recent Searches Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <View style={styles.emptyContainer}>
            <IconSymbol 
              ios_icon_name="clock" 
              android_material_icon_name="history" 
              size={64} 
              color={colors.textSecondary} 
            />
            <Text style={styles.emptyText}>No recent searches</Text>
            <Text style={styles.emptySubtext}>Your search history will appear here</Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Sign Out Confirmation Modal */}
      <Modal
        visible={showSignOutModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to sign out?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowSignOutModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleSignOut}
              >
                <Text style={styles.modalConfirmText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  signOutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  listButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
    gap: 8,
  },
  listButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  propertiesGrid: {
    gap: 16,
  },
  propertyCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  propertyImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.highlight,
  },
  propertyImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyInfo: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  propertyDistrict: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  propertyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  propertySize: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bottomPadding: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
