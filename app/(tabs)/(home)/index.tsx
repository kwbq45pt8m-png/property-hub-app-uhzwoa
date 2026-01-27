
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  ImageSourcePropType,
  Modal,
  Platform,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { useAuth } from "@/contexts/AuthContext";
import { authenticatedGet } from "@/utils/api";

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

const HK_DISTRICTS = [
  "All Districts",
  "Central and Western",
  "Eastern",
  "Southern",
  "Wan Chai",
  "Sham Shui Po",
  "Kowloon City",
  "Kwun Tong",
  "Wong Tai Sin",
  "Yau Tsim Mong",
  "Islands",
  "Kwai Tsing",
  "North",
  "Sai Kung",
  "Sha Tin",
  "Tai Po",
  "Tsuen Wan",
  "Tuen Mun",
  "Yuen Long",
];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minSize, setMinSize] = useState("");
  const [maxSize, setMaxSize] = useState("");

  useEffect(() => {
    console.log("HomeScreen mounted, checking auth status");
    console.log("User authenticated:", !!user);
    if (!authLoading && !user) {
      console.log("User not authenticated, redirecting to auth screen");
      router.replace("/auth");
    } else if (user) {
      console.log("✅ User logged in successfully! Welcome to the home screen.");
      console.log("User details:", { name: user.name, email: user.email });
      loadProperties();
    }
  }, [user, authLoading]);

  const loadProperties = async () => {
    console.log("Loading properties...");
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (selectedDistrict !== "All Districts") {
        params.append("district", selectedDistrict);
      }
      if (minPrice) {
        params.append("minPrice", minPrice);
      }
      if (maxPrice) {
        params.append("maxPrice", maxPrice);
      }
      if (minSize) {
        params.append("minSize", minSize);
      }
      if (maxSize) {
        params.append("maxSize", maxSize);
      }

      const queryString = params.toString();
      const url = queryString ? `/api/properties?${queryString}` : "/api/properties";
      
      console.log("Fetching properties from:", url);
      const data = await authenticatedGet<Property[]>(url);
      console.log("Properties loaded:", data.length);
      setProperties(data);
    } catch (error) {
      console.error("Error loading properties:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProperties();
    }
  }, [selectedDistrict, minPrice, maxPrice, minSize, maxSize]);

  const filteredProperties = properties.filter((property) => {
    const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.district.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handlePropertyPress = (propertyId: string) => {
    console.log("Navigating to property:", propertyId);
    router.push(`/property/${propertyId}`);
  };

  const handleListProperty = () => {
    console.log("User tapped List Property button");
    router.push("/list-property");
  };

  const clearFilters = () => {
    console.log("Clearing filters");
    setSelectedDistrict("All Districts");
    setMinPrice("");
    setMaxPrice("");
    setMinSize("");
    setMaxSize("");
  };

  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  const welcomeMessage = `Welcome back${user.name ? ', ' + user.name : ''}!`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Find Your Home</Text>
          <Text style={styles.headerSubtitle}>{welcomeMessage}</Text>
        </View>
        <TouchableOpacity 
          style={styles.listPropertyButton}
          onPress={handleListProperty}
          activeOpacity={0.8}
        >
          <IconSymbol 
            ios_icon_name="plus" 
            android_material_icon_name="add" 
            size={20} 
            color="#FFFFFF" 
          />
          <Text style={styles.listPropertyButtonText}>List Property</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <IconSymbol 
          ios_icon_name="magnifyingglass" 
          android_material_icon_name="search" 
          size={20} 
          color={colors.textSecondary} 
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search properties..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.filterButton}>
          <IconSymbol 
            ios_icon_name="slider.horizontal.3" 
            android_material_icon_name="tune" 
            size={20} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* District Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.districtScroll}
        contentContainerStyle={styles.districtScrollContent}
      >
        {HK_DISTRICTS.map((district) => {
          const isSelected = selectedDistrict === district;
          return (
            <TouchableOpacity
              key={district}
              style={[
                styles.districtChip,
                isSelected && styles.districtChipSelected,
              ]}
              onPress={() => setSelectedDistrict(district)}
            >
              <Text
                style={[
                  styles.districtChipText,
                  isSelected && styles.districtChipTextSelected,
                ]}
              >
                {district}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Properties List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading properties...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.propertiesList}
          contentContainerStyle={styles.propertiesListContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredProperties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol 
                ios_icon_name="house" 
                android_material_icon_name="home" 
                size={64} 
                color={colors.textSecondary} 
              />
              <Text style={styles.emptyText}>No properties found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters or check back later</Text>
              <TouchableOpacity 
                style={styles.emptyActionButton}
                onPress={handleListProperty}
              >
                <Text style={styles.emptyActionButtonText}>List Your Property</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredProperties.map((property) => {
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
                  <Image
                    source={resolveImageSource(firstPhoto || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2')}
                    style={styles.propertyImage}
                    resizeMode="cover"
                  />
                  <View style={styles.propertyInfo}>
                    <Text style={styles.propertyTitle} numberOfLines={1}>
                      {property.title}
                    </Text>
                    <Text style={styles.propertyDistrict} numberOfLines={1}>
                      {property.district}
                    </Text>
                    <View style={styles.propertyDetails}>
                      <View style={styles.propertyDetailItem}>
                        <IconSymbol 
                          ios_icon_name="dollarsign.circle" 
                          android_material_icon_name="attach-money" 
                          size={16} 
                          color={colors.primary} 
                        />
                        <Text style={styles.propertyDetailText}>{priceText}</Text>
                      </View>
                      <View style={styles.propertyDetailItem}>
                        <IconSymbol 
                          ios_icon_name="square.grid.2x2" 
                          android_material_icon_name="square-foot" 
                          size={16} 
                          color={colors.primary} 
                        />
                        <Text style={styles.propertyDetailText}>{sizeText}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <IconSymbol 
                  ios_icon_name="xmark" 
                  android_material_icon_name="close" 
                  size={24} 
                  color={colors.text} 
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.filterLabel}>Price Range (HK$)</Text>
              <View style={styles.filterRow}>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Min"
                  placeholderTextColor={colors.textSecondary}
                  value={minPrice}
                  onChangeText={setMinPrice}
                  keyboardType="numeric"
                />
                <Text style={styles.filterSeparator}>-</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Max"
                  placeholderTextColor={colors.textSecondary}
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  keyboardType="numeric"
                />
              </View>

              <Text style={styles.filterLabel}>Size Range (sq ft)</Text>
              <View style={styles.filterRow}>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Min"
                  placeholderTextColor={colors.textSecondary}
                  value={minSize}
                  onChangeText={setMinSize}
                  keyboardType="numeric"
                />
                <Text style={styles.filterSeparator}>-</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Max"
                  placeholderTextColor={colors.textSecondary}
                  value={maxSize}
                  onChangeText={setMaxSize}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => setShowFilters(false)}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  listPropertyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
    elevation: 3,
  },
  listPropertyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  filterButton: {
    padding: 4,
  },
  districtScroll: {
    maxHeight: 50,
    marginBottom: 16,
  },
  districtScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  districtChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  districtChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  districtChipText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  districtChipTextSelected: {
    color: '#FFFFFF',
  },
  propertiesList: {
    flex: 1,
  },
  propertiesListContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
  emptyActionButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  propertyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  propertyImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.backgroundAlt,
  },
  propertyInfo: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  propertyDistrict: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  propertyDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  propertyDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  propertyDetailText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  bottomPadding: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalScroll: {
    paddingHorizontal: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 16,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterInput: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterSeparator: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
