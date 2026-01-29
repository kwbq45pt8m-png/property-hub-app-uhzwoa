
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  Image,
  ImageSourcePropType,
} from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { useAuth } from "@/contexts/AuthContext";
import { authenticatedGet, authenticatedPut, authenticatedDelete, BACKEND_URL, getBearerToken } from "@/utils/api";
import * as ImagePicker from "expo-image-picker";
import AdModal from "@/components/AdModal";
import { useLanguage } from "@/contexts/LanguageContext";

const HK_DISTRICTS = [
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

// Helper to resolve image sources (handles both local require() and remote URLs)
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

export default function EditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<Property | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [district, setDistrict] = useState("");
  const [equipment, setEquipment] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [virtualTourVideoUrl, setVirtualTourVideoUrl] = useState("");
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      console.log("Loading property for editing:", id);
      const data = await authenticatedGet<Property>(`/api/properties/${id}`);
      
      // Check if user is the owner
      if (data.ownerId !== user?.id) {
        console.error("User is not the owner of this property");
        showError("You are not authorized to edit this property");
        router.back();
        return;
      }

      console.log("Property loaded:", data);
      setProperty(data);
      setTitle(data.title);
      setDescription(data.description || "");
      setPrice(data.price);
      setSize(data.size.toString());
      setDistrict(data.district);
      setEquipment(data.equipment || "");
      setPhotos(data.photos || []);
      setVirtualTourVideoUrl(data.virtualTourUrl || "");
    } catch (error: any) {
      console.error("Error loading property:", error);
      showError("Failed to load property. Please try again.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const handlePickPhotos = async () => {
    console.log("User tapped Add Photos button");

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      showError("Please allow access to your photo library to upload photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });

    if (!result.canceled && result.assets.length > 0) {
      console.log("Selected photos:", result.assets.length);
      setUploadingPhotos(true);

      try {
        const uploadedUrls: string[] = [];

        for (const asset of result.assets) {
          const token = await getBearerToken();
          if (!token) {
            throw new Error("Authentication token not found");
          }

          const formData = new FormData();
          const uriParts = asset.uri.split('.');
          const fileType = uriParts[uriParts.length - 1];

          formData.append('image', {
            uri: asset.uri,
            name: `photo.${fileType}`,
            type: `image/${fileType}`,
          } as any);

          console.log("Uploading photo to:", `${BACKEND_URL}/api/upload/property-image`);
          const response = await fetch(`${BACKEND_URL}/api/upload/property-image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });

          console.log("Upload response status:", response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Upload error response:", errorText);
            throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          uploadedUrls.push(data.url);
          console.log("Photo uploaded successfully:", data.url);
        }

        setPhotos([...photos, ...uploadedUrls]);
        console.log("✅ All photos uploaded successfully!");
      } catch (error: any) {
        console.error("Error uploading photos:", error);
        showError(t('uploadPhotosFailed') + " " + (error.message || ""));
      } finally {
        setUploadingPhotos(false);
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    console.log("Removing photo at index:", index);
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  const handlePickVideo = async () => {
    console.log("User tapped Add Virtual Tour Video button");

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      showError("Please allow access to your photo library to upload videos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "videos",
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      console.log("Selected video:", result.assets[0].uri);
      setUploadingVideo(true);

      try {
        const asset = result.assets[0];
        const token = await getBearerToken();
        if (!token) {
          throw new Error("Authentication token not found");
        }

        const formData = new FormData();
        const uriParts = asset.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('video', {
          uri: asset.uri,
          name: `video.${fileType}`,
          type: `video/${fileType}`,
        } as any);

        console.log("Uploading video to:", `${BACKEND_URL}/api/upload/virtual-tour-video`);
        const response = await fetch(`${BACKEND_URL}/api/upload/virtual-tour-video`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        console.log("Upload response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Upload error response:", errorText);
          throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        setVirtualTourVideoUrl(data.url);
        console.log("✅ Video uploaded successfully:", data.url);
      } catch (error: any) {
        console.error("Error uploading video:", error);
        showError(t('uploadVideoFailed') + " " + (error.message || ""));
      } finally {
        setUploadingVideo(false);
      }
    }
  };

  const handleRemoveVideo = () => {
    console.log("Removing virtual tour video");
    setVirtualTourVideoUrl("");
  };

  const handleSubmitClick = () => {
    console.log("User tapped Update Property button - showing ad first");
    setShowAdModal(true);
  };

  const handleAdComplete = () => {
    console.log("Ad completed - proceeding with property update");
    setShowAdModal(false);
    handleSubmit();
  };

  const handleSubmit = async () => {
    console.log("Updating property listing");

    const titleTrimmed = title.trim();
    const descriptionTrimmed = description.trim();
    const priceTrimmed = price.trim();
    const sizeTrimmed = size.trim();
    const districtTrimmed = district.trim();

    if (!titleTrimmed) {
      showError(t('enterTitle'));
      return;
    }

    if (!descriptionTrimmed) {
      showError(t('enterDescription'));
      return;
    }

    if (!priceTrimmed) {
      showError(t('enterPrice'));
      return;
    }

    if (!sizeTrimmed) {
      showError(t('enterSize'));
      return;
    }

    if (!districtTrimmed) {
      showError(t('selectDistrictError'));
      return;
    }

    try {
      setUpdating(true);
      console.log("Updating property:", {
        id,
        title: titleTrimmed,
        price: priceTrimmed,
        size: sizeTrimmed,
        district: districtTrimmed,
        photosCount: photos.length,
        hasVideo: !!virtualTourVideoUrl,
      });

      const propertyData = {
        title: titleTrimmed,
        description: descriptionTrimmed,
        price: priceTrimmed,
        size: parseInt(sizeTrimmed, 10),
        district: districtTrimmed,
        equipment: equipment.trim(),
        virtualTourUrl: virtualTourVideoUrl.trim() || undefined,
        photos: photos,
      };

      await authenticatedPut(`/api/properties/${id}`, propertyData);

      console.log("✅ Property updated successfully!");
      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
        router.back();
      }, 2000);
    } catch (error: any) {
      console.error("Error updating property:", error);
      showError(t('errorUpdatingProperty') + " " + (error.message || ""));
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = () => {
    console.log("User tapped Delete Property button");
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    console.log("User confirmed property deletion");
    setShowDeleteModal(false);
    
    try {
      setDeleting(true);
      console.log("Deleting property:", id);
      await authenticatedDelete(`/api/properties/${id}`);
      console.log("✅ Property deleted successfully!");
      
      // Show success message briefly then navigate back
      showError(t('propertyDeletedSuccess'));
      setTimeout(() => {
        router.replace("/(tabs)/profile");
      }, 1500);
    } catch (error: any) {
      console.error("Error deleting property:", error);
      showError(t('errorDeletingProperty') + " " + (error.message || ""));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen
          options={{
            title: t('editProperty'),
            headerShown: true,
            headerBackTitle: "Back",
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const districtDisplay = district || t('selectDistrict');
  const editPropertyTitle = t('editProperty');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: editPropertyTitle,
          headerShown: true,
          headerBackTitle: "Back",
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('editProperty')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('fillDetails')}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('propertyTitle')}</Text>
            <Text style={styles.required}>{t('required')}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Spacious 2BR Apartment in Central"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('propertyDescription')}</Text>
            <Text style={styles.required}>{t('required')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your property, amenities, nearby facilities..."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, styles.formGroupHalf]}>
              <Text style={styles.label}>{t('monthlyRentHKD')}</Text>
              <Text style={styles.required}>{t('required')}</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 15000"
                placeholderTextColor={colors.textSecondary}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.formGroup, styles.formGroupHalf]}>
              <Text style={styles.label}>{t('sizeSqFt')}</Text>
              <Text style={styles.required}>{t('required')}</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 600"
                placeholderTextColor={colors.textSecondary}
                value={size}
                onChangeText={setSize}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('district')}</Text>
            <Text style={styles.required}>{t('required')}</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowDistrictPicker(true)}
            >
              <Text
                style={[
                  styles.pickerButtonText,
                  !district && styles.pickerButtonTextPlaceholder,
                ]}
              >
                {districtDisplay}
              </Text>
              <IconSymbol
                ios_icon_name="chevron.down"
                android_material_icon_name="arrow-drop-down"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('equipment')}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Air conditioning, Washing machine, WiFi"
              placeholderTextColor={colors.textSecondary}
              value={equipment}
              onChangeText={setEquipment}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('propertyPhotos')}</Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handlePickPhotos}
              disabled={uploadingPhotos}
              activeOpacity={0.7}
            >
              {uploadingPhotos ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <React.Fragment>
                  <IconSymbol
                    ios_icon_name="photo"
                    android_material_icon_name="photo"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.uploadButtonText}>{t('addPhotos')}</Text>
                </React.Fragment>
              )}
            </TouchableOpacity>

            {photos.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.photoPreviewContainer}
              >
                {photos.map((photoUrl, index) => {
                  const photoSource = resolveImageSource(photoUrl);
                  return (
                    <View key={index} style={styles.photoPreview}>
                      <Image source={photoSource} style={styles.photoImage} />
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => handleRemovePhoto(index)}
                      >
                        <IconSymbol
                          ios_icon_name="xmark.circle.fill"
                          android_material_icon_name="cancel"
                          size={24}
                          color="#FF3B30"
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('virtualTourVideo')}</Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handlePickVideo}
              disabled={uploadingVideo || !!virtualTourVideoUrl}
              activeOpacity={0.7}
            >
              {uploadingVideo ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <React.Fragment>
                  <IconSymbol
                    ios_icon_name="video"
                    android_material_icon_name="videocam"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.uploadButtonText}>
                    {virtualTourVideoUrl ? t('videoAdded') : t('addVirtualTourVideo')}
                  </Text>
                </React.Fragment>
              )}
            </TouchableOpacity>

            {virtualTourVideoUrl && (
              <View style={styles.videoPreviewContainer}>
                <View style={styles.videoPreview}>
                  <IconSymbol
                    ios_icon_name="video.fill"
                    android_material_icon_name="videocam"
                    size={32}
                    color={colors.primary}
                  />
                  <Text style={styles.videoPreviewText}>{t('virtualTourVideoAdded')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeVideoButton}
                  onPress={handleRemoveVideo}
                >
                  <IconSymbol
                    ios_icon_name="trash"
                    android_material_icon_name="delete"
                    size={20}
                    color="#FF3B30"
                  />
                  <Text style={styles.removeVideoButtonText}>{t('remove')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, updating && styles.submitButtonDisabled]}
            onPress={handleSubmitClick}
            disabled={updating}
            activeOpacity={0.8}
          >
            {updating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <React.Fragment>
                <IconSymbol
                  ios_icon_name="checkmark.circle"
                  android_material_icon_name="check-circle"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.submitButtonText}>{t('updatePropertyButton')}</Text>
              </React.Fragment>
            )}
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity
            style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
            onPress={handleDeleteClick}
            disabled={deleting}
            activeOpacity={0.8}
          >
            {deleting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <React.Fragment>
                <IconSymbol
                  ios_icon_name="trash"
                  android_material_icon_name="delete"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.deleteButtonText}>{t('deleteProperty')}</Text>
              </React.Fragment>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* District Picker Modal */}
      <Modal
        visible={showDistrictPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDistrictPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectDistrict')}</Text>
              <TouchableOpacity onPress={() => setShowDistrictPicker(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.districtList}>
              {HK_DISTRICTS.map((districtOption) => {
                const isSelected = district === districtOption;
                return (
                  <TouchableOpacity
                    key={districtOption}
                    style={[
                      styles.districtOption,
                      isSelected && styles.districtOptionSelected,
                    ]}
                    onPress={() => {
                      console.log("Selected district:", districtOption);
                      setDistrict(districtOption);
                      setShowDistrictPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.districtOptionText,
                        isSelected && styles.districtOptionTextSelected,
                      ]}
                    >
                      {districtOption}
                    </Text>
                    {isSelected && (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={64}
              color={colors.primary}
            />
            <Text style={styles.successModalTitle}>{t('success')}</Text>
            <Text style={styles.successModalText}>
              {t('propertyUpdatedSuccess')}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>{t('deleteProperty')}</Text>
            <Text style={styles.deleteModalMessage}>{t('confirmDelete')}</Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.deleteModalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalConfirmButton}
                onPress={handleDeleteConfirm}
              >
                <Text style={styles.deleteModalConfirmText}>{t('delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={errorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.errorModalOverlay}>
          <View style={styles.errorModalContent}>
            <Text style={styles.errorModalTitle}>{t('uploadError')}</Text>
            <Text style={styles.errorModalMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.errorModalButton}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.errorModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AdModal isVisible={showAdModal} onAdComplete={handleAdComplete} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  form: {
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  required: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  pickerButton: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  pickerButtonTextPlaceholder: {
    color: colors.textSecondary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
    elevation: 3,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
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
    maxHeight: '70%',
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
  districtList: {
    paddingHorizontal: 20,
  },
  districtOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.backgroundAlt,
  },
  districtOptionSelected: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  districtOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  districtOptionTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    marginHorizontal: 40,
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.2)',
    elevation: 5,
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  successModalText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  photoPreviewContainer: {
    marginTop: 12,
  },
  photoPreview: {
    width: 100,
    height: 100,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  videoPreviewContainer: {
    marginTop: 12,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  videoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  videoPreviewText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  removeVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FF3B3020',
    borderRadius: 8,
  },
  removeVideoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  deleteModalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  deleteModalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  deleteModalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  deleteModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorModalContent: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  errorModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: colors.text,
  },
  errorModalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorModalButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  errorModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
