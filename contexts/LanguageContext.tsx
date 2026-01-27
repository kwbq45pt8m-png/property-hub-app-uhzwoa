
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
    
    // Language names
    english: "English",
    traditionalChinese: "繁體中文",
    simplifiedChinese: "简体中文",
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
    
    // Language names
    english: "English",
    traditionalChinese: "繁體中文",
    simplifiedChinese: "简体中文",
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
    
    // Language names
    english: "English",
    traditionalChinese: "繁體中文",
    simplifiedChinese: "简体中文",
  },
};
