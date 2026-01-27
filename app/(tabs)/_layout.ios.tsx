
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { VectorIcon } from 'expo-router/unstable-native-tabs';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(home)">
        <Label>Home</Label>
        {Platform.select({
          ios: <Icon sf={{ default: 'house', selected: 'house.fill' }} />,
          android: <Icon src={<VectorIcon family={MaterialIcons} name="home" />} />,
        })}
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="chats">
        <Label>Chats</Label>
        {Platform.select({
          ios: <Icon sf={{ default: 'message', selected: 'message.fill' }} />,
          android: <Icon src={<VectorIcon family={MaterialIcons} name="message" />} />,
        })}
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        {Platform.select({
          ios: <Icon sf={{ default: 'person', selected: 'person.fill' }} />,
          android: <Icon src={<VectorIcon family={MaterialIcons} name="person" />} />,
        })}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
