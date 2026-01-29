
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Language = "en" | "zh-TW" | "zh-CN";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "@app_language";

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && (savedLanguage === "en" || savedLanguage === "zh-TW" || savedLanguage === "zh-CN")) {
        setLanguageState(savedLanguage as Language);
        console.log("Loaded saved language:", savedLanguage);
      }
    } catch (error) {
      console.error("Error loading language:", error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
      console.log("Language changed to:", lang);
    } catch (error) {
      console.error("Error saving language:", error);
    }
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Translation strings
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Home Screen
    findYourHome: "Find your place",
    welcomeBack: "Welcome back",
    listProperty: "List Property",
    searchProperties: "Search properties...",
    allDistricts: "All Districts",
    loadingProperties: "Loading properties...",
    noPropertiesFound: "No properties found",
    tryAdjustingFilters: "Try adjusting your filters or check back later",
    listYourProperty: "List Your Property",
    
    // Filters
    filters: "Filters",
    priceRange: "Price Range (HK$)",
    sizeRange: "Size Range (sq ft)",
    min: "Min",
    max: "Max",
    clearAll: "Clear All",
    applyFilters: "Apply Filters",
    
    // Districts
    centralAndWestern: "Central and Western",
    eastern: "Eastern",
    southern: "Southern",
    wanChai: "Wan Chai",
    shamShuiPo: "Sham Shui Po",
    kowloonCity: "Kowloon City",
    kwunTong: "Kwun Tong",
    wongTaiSin: "Wong Tai Sin",
    yauTsimMong: "Yau Tsim Mong",
    islands: "Islands",
    kwaiTsing: "Kwai Tsing",
    north: "North",
    saiKung: "Sai Kung",
    shaTin: "Sha Tin",
    taiPo: "Tai Po",
    tsuenWan: "Tsuen Wan",
    tuenMun: "Tuen Mun",
    yuenLong: "Yuen Long",
    
    // Property Details
    monthlyRent: "Monthly Rent",
    size: "Size",
    description: "Description",
    equipmentAmenities: "Equipment & Amenities",
    virtualTour: "Virtual Tour",
    contactOwner: "Contact Owner",
    propertyNotFound: "Property not found",
    loading: "Loading...",
    
    // List Property
    propertyTitle: "Property Title",
    propertyDescription: "Description",
    monthlyRentHKD: "Monthly Rent (HK$)",
    sizeSqFt: "Size (sq ft)",
    district: "District",
    selectDistrict: "Select District",
    equipment: "Equipment & Amenities",
    propertyPhotos: "Property Photos",
    addPhotos: "Add Photos",
    virtualTourVideo: "Virtual Tour Video (Optional)",
    addVirtualTourVideo: "Add Virtual Tour Video",
    videoAdded: "Video Added",
    listPropertyButton: "List Property",
    fillDetails: "Fill in the details to list your property for rent",
    required: "*",
    missingInfo: "Missing Information",
    enterTitle: "Please enter a property title",
    enterDescription: "Please enter a property description",
    enterPrice: "Please enter a monthly rent price",
    enterSize: "Please enter the property size",
    selectDistrictError: "Please select a district",
    success: "Success!",
    propertyListedSuccess: "Your property has been listed successfully",
    uploadError: "Upload Error",
    uploadPhotosFailed: "Failed to upload photos. Please try again.",
    uploadVideoFailed: "Failed to upload video. Please try again.",
    videoTooLarge: "Video file is too large. Maximum size is 200MB. Please try a shorter video or compress it.",
    imageTooLarge: "Image file is too large. Maximum size is 5MB per image.",
    errorListingProperty: "Failed to list property. Please try again.",
    remove: "Remove",
    virtualTourVideoAdded: "Virtual tour video added",
    
    // Profile
    profile: "Profile",
    myListings: "My Listings",
    recentSearches: "Recent Searches",
    signOut: "Sign Out",
    noListings: "You haven't listed any properties yet",
    noSearches: "No recent searches",
    confirmSignOut: "Are you sure you want to sign out?",
    cancel: "Cancel",
    
    // Chats
    chats: "Chats",
    noChats: "No conversations yet",
    startChatting: "Start chatting with property owners to see your conversations here",
    
    // Chat Screen
    typeMessage: "Type a message...",
    send: "Send",
    
    // Language names
    english: "English",
    traditionalChinese: "繁體中文",
    simplifiedChinese: "简体中文",
    
    // Edit Property
    editListing: "Edit Listing",
    editProperty: "Edit Property",
    updateProperty: "Update Property",
    updatePropertyButton: "Update Property",
    propertyUpdatedSuccess: "Your property has been updated successfully",
    errorUpdatingProperty: "Failed to update property. Please try again.",
    deleteProperty: "Delete Property",
    confirmDelete: "Are you sure you want to delete this property? This action cannot be undone.",
    delete: "Delete",
    propertyDeletedSuccess: "Property deleted successfully",
    errorDeletingProperty: "Failed to delete property. Please try again.",
  },
  "zh-TW": {
    // Home Screen
    findYourHome: "尋找您的地方",
    welcomeBack: "歡迎回來",
    listProperty: "刊登物業",
    searchProperties: "搜尋物業...",
    allDistricts: "所有地區",
    loadingProperties: "載入物業中...",
    noPropertiesFound: "找不到物業",
    tryAdjustingFilters: "請調整篩選條件或稍後再試",
    listYourProperty: "刊登您的物業",
    
    // Filters
    filters: "篩選",
    priceRange: "價格範圍 (港幣)",
    sizeRange: "面積範圍 (平方呎)",
    min: "最低",
    max: "最高",
    clearAll: "清除全部",
    applyFilters: "套用篩選",
    
    // Districts
    centralAndWestern: "中西區",
    eastern: "東區",
    southern: "南區",
    wanChai: "灣仔",
    shamShuiPo: "深水埗",
    kowloonCity: "九龍城",
    kwunTong: "觀塘",
    wongTaiSin: "黃大仙",
    yauTsimMong: "油尖旺",
    islands: "離島",
    kwaiTsing: "葵青",
    north: "北區",
    saiKung: "西貢",
    shaTin: "沙田",
    taiPo: "大埔",
    tsuenWan: "荃灣",
    tuenMun: "屯門",
    yuenLong: "元朗",
    
    // Property Details
    monthlyRent: "月租",
    size: "面積",
    description: "描述",
    equipmentAmenities: "設備及配套",
    virtualTour: "虛擬導覽",
    contactOwner: "聯絡業主",
    propertyNotFound: "找不到物業",
    loading: "載入中...",
    
    // List Property
    propertyTitle: "物業標題",
    propertyDescription: "描述",
    monthlyRentHKD: "月租 (港幣)",
    sizeSqFt: "面積 (平方呎)",
    district: "地區",
    selectDistrict: "選擇地區",
    equipment: "設備及配套",
    propertyPhotos: "物業照片",
    addPhotos: "新增照片",
    virtualTourVideo: "虛擬導覽影片 (選填)",
    addVirtualTourVideo: "新增虛擬導覽影片",
    videoAdded: "已新增影片",
    listPropertyButton: "刊登物業",
    fillDetails: "填寫詳細資料以刊登您的出租物業",
    required: "*",
    missingInfo: "缺少資料",
    enterTitle: "請輸入物業標題",
    enterDescription: "請輸入物業描述",
    enterPrice: "請輸入月租價格",
    enterSize: "請輸入物業面積",
    selectDistrictError: "請選擇地區",
    success: "成功！",
    propertyListedSuccess: "您的物業已成功刊登",
    uploadError: "上傳錯誤",
    uploadPhotosFailed: "上傳照片失敗，請重試。",
    uploadVideoFailed: "上傳影片失敗，請重試。",
    videoTooLarge: "影片檔案過大。最大容量為 200MB。請嘗試較短的影片或壓縮檔案。",
    imageTooLarge: "圖片檔案過大。每張圖片最大容量為 5MB。",
    errorListingProperty: "刊登物業失敗，請重試。",
    remove: "移除",
    virtualTourVideoAdded: "已新增虛擬導覽影片",
    
    // Profile
    profile: "個人檔案",
    myListings: "我的刊登",
    recentSearches: "最近搜尋",
    signOut: "登出",
    noListings: "您尚未刊登任何物業",
    noSearches: "沒有最近搜尋",
    confirmSignOut: "確定要登出嗎？",
    cancel: "取消",
    
    // Chats
    chats: "對話",
    noChats: "尚無對話",
    startChatting: "開始與業主對話後，您的對話將顯示在這裡",
    
    // Chat Screen
    typeMessage: "輸入訊息...",
    send: "傳送",
    
    // Language names
    english: "English",
    traditionalChinese: "繁體中文",
    simplifiedChinese: "简体中文",
    
    // Edit Property
    editListing: "編輯刊登",
    editProperty: "編輯物業",
    updateProperty: "更新物業",
    updatePropertyButton: "更新物業",
    propertyUpdatedSuccess: "您的物業已成功更新",
    errorUpdatingProperty: "更新物業失敗，請重試。",
    deleteProperty: "刪除物業",
    confirmDelete: "確定要刪除此物業嗎？此操作無法復原。",
    delete: "刪除",
    propertyDeletedSuccess: "物業已成功刪除",
    errorDeletingProperty: "刪除物業失敗，請重試。",
  },
  "zh-CN": {
    // Home Screen
    findYourHome: "寻找您的地方",
    welcomeBack: "欢迎回来",
    listProperty: "刊登物业",
    searchProperties: "搜索物业...",
    allDistricts: "所有地区",
    loadingProperties: "加载物业中...",
    noPropertiesFound: "找不到物业",
    tryAdjustingFilters: "请调整筛选条件或稍后再试",
    listYourProperty: "刊登您的物业",
    
    // Filters
    filters: "筛选",
    priceRange: "价格范围 (港币)",
    sizeRange: "面积范围 (平方呎)",
    min: "最低",
    max: "最高",
    clearAll: "清除全部",
    applyFilters: "应用筛选",
    
    // Districts
    centralAndWestern: "中西区",
    eastern: "东区",
    southern: "南区",
    wanChai: "湾仔",
    shamShuiPo: "深水埗",
    kowloonCity: "九龙城",
    kwunTong: "观塘",
    wongTaiSin: "黄大仙",
    yauTsimMong: "油尖旺",
    islands: "离岛",
    kwaiTsing: "葵青",
    north: "北区",
    saiKung: "西贡",
    shaTin: "沙田",
    taiPo: "大埔",
    tsuenWan: "荃湾",
    tuenMun: "屯门",
    yuenLong: "元朗",
    
    // Property Details
    monthlyRent: "月租",
    size: "面积",
    description: "描述",
    equipmentAmenities: "设备及配套",
    virtualTour: "虚拟导览",
    contactOwner: "联络业主",
    propertyNotFound: "找不到物业",
    loading: "加载中...",
    
    // List Property
    propertyTitle: "物业标题",
    propertyDescription: "描述",
    monthlyRentHKD: "月租 (港币)",
    sizeSqFt: "面积 (平方呎)",
    district: "地区",
    selectDistrict: "选择地区",
    equipment: "设备及配套",
    propertyPhotos: "物业照片",
    addPhotos: "新增照片",
    virtualTourVideo: "虚拟导览影片 (选填)",
    addVirtualTourVideo: "新增虚拟导览影片",
    videoAdded: "已新增影片",
    listPropertyButton: "刊登物业",
    fillDetails: "填写详细资料以刊登您的出租物业",
    required: "*",
    missingInfo: "缺少资料",
    enterTitle: "请输入物业标题",
    enterDescription: "请输入物业描述",
    enterPrice: "请输入月租价格",
    enterSize: "请输入物业面积",
    selectDistrictError: "请选择地区",
    success: "成功！",
    propertyListedSuccess: "您的物业已成功刊登",
    uploadError: "上传错误",
    uploadPhotosFailed: "上传照片失败，请重试。",
    uploadVideoFailed: "上传影片失败，请重试。",
    videoTooLarge: "影片档案过大。最大容量为 200MB。请尝试较短的影片或压缩档案。",
    imageTooLarge: "图片档案过大。每张图片最大容量为 5MB。",
    errorListingProperty: "刊登物业失败，请重试。",
    remove: "移除",
    virtualTourVideoAdded: "已新增虚拟导览影片",
    
    // Profile
    profile: "个人档案",
    myListings: "我的刊登",
    recentSearches: "最近搜索",
    signOut: "登出",
    noListings: "您尚未刊登任何物业",
    noSearches: "没有最近搜索",
    confirmSignOut: "确定要登出吗？",
    cancel: "取消",
    
    // Chats
    chats: "对话",
    noChats: "尚无对话",
    startChatting: "开始与业主对话后，您的对话将显示在这里",
    
    // Chat Screen
    typeMessage: "输入讯息...",
    send: "传送",
    
    // Language names
    english: "English",
    traditionalChinese: "繁體中文",
    simplifiedChinese: "简体中文",
    
    // Edit Property
    editListing: "编辑刊登",
    editProperty: "编辑物业",
    updateProperty: "更新物业",
    updatePropertyButton: "更新物业",
    propertyUpdatedSuccess: "您的物业已成功更新",
    errorUpdatingProperty: "更新物业失败，请重试。",
    deleteProperty: "删除物业",
    confirmDelete: "确定要删除此物业吗？此操作无法复原。",
    delete: "删除",
    propertyDeletedSuccess: "物业已成功删除",
    errorDeletingProperty: "删除物业失败，请重试。",
  },
};
