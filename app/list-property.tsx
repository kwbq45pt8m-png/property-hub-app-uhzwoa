
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { useAuth } from "@/contexts/AuthContext";
import { authenticatedPost } from "@/utils/api";

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

export default function ListPropertyScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [district, setDistrict] = useState("");
  const [equipment, setEquipment] = useState("");
  const [virtualTourUrl, setVirtualTourUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async () => {
    console.log("User tapped Submit Property button");

    const titleTrimmed = title.trim();
    const descriptionTrimmed = description.trim();
    const priceTrimmed = price.trim();
    const sizeTrimmed = size.trim();
    const districtTrimmed = district.trim();

    if (!titleTrimmed) {
      Alert.alert("Missing Information", "Please enter a property title");
      return;
    }

    if (!descriptionTrimmed) {
      Alert.alert("Missing Information", "Please enter a property description");
      return;
    }

    if (!priceTrimmed) {
      Alert.alert("Missing Information", "Please enter a monthly rent price");
      return;
    }

    if (!sizeTrimmed) {
      Alert.alert("Missing Information", "Please enter the property size");
      return;
    }

    if (!districtTrimmed) {
      Alert.alert("Missing Information", "Please select a district");
      return;
    }

    try {
      setLoading(true);
      console.log("Submitting property listing:", {
        title: titleTrimmed,
        price: priceTrimmed,
        size: sizeTrimmed,
        district: districtTrimmed,
      });

      const propertyData = {
        title: titleTrimmed,
        description: descriptionTrimmed,
        price: priceTrimmed,
        size: parseInt(sizeTrimmed, 10),
        district: districtTrimmed,
        equipment: equipment.trim(),
        virtualTourUrl: virtualTourUrl.trim() || undefined,
        photos: [],
      };

      await authenticatedPost("/api/properties", propertyData);

      console.log("✅ Property listed successfully!");
      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
        router.back();
      }, 2000);
    } catch (error) {
      console.error("Error listing property:", error);
      Alert.alert(
        "Error",
        "Failed to list property. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const districtDisplay = district || "Select District";

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: "List Property",
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
          <Text style={styles.headerTitle}>List Your Property</Text>
          <Text style={styles.headerSubtitle}>
            Fill in the details to list your property for rent
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Property Title</Text>
            <Text style={styles.required}>*</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Spacious 2BR Apartment in Central"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.required}>*</Text>
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
              <Text style={styles.label}>Monthly Rent (HK$)</Text>
              <Text style={styles.required}>*</Text>
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
              <Text style={styles.label}>Size (sq ft)</Text>
              <Text style={styles.required}>*</Text>
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
            <Text style={styles.label}>District</Text>
            <Text style={styles.required}>*</Text>
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
            <Text style={styles.label}>Equipment & Amenities</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Air conditioning, Washing machine, WiFi"
              placeholderTextColor={colors.textSecondary}
              value={equipment}
              onChangeText={setEquipment}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Virtual Tour URL (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., https://..."
              placeholderTextColor={colors.textSecondary}
              value={virtualTourUrl}
              onChangeText={setVirtualTourUrl}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <React.Fragment>
                <IconSymbol
                  ios_icon_name="checkmark.circle"
                  android_material_icon_name="check-circle"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.submitButtonText}>List Property</Text>
              </React.Fragment>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showDistrictPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDistrictPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select District</Text>
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
            <Text style={styles.successModalTitle}>Success!</Text>
            <Text style={styles.successModalText}>
              Your property has been listed successfully
            </Text>
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
});
