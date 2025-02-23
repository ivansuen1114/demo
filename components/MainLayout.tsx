import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Animated, TouchableWithoutFeedback } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Sidebar from './Sidebar';
import SubMenu from './SubMenu';
import TopBar from './TopBar';
import Breadcrumb from './Breadcrumb';

interface MenuItem {
  icon: string;
  label: string;
  route?: string;
  subItems?: { label: string; route: string; }[];
}

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumbs?: { label: string; route?: string; }[];
  toolbarContent?: React.ReactNode;
}

export default function MainLayout({ children, title, breadcrumbs = [], toolbarContent }: MainLayoutProps) {
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItem | null>(null);

  const handleMenuSelect = (item: MenuItem) => {
    setActiveMenuItem(activeMenuItem?.label === item.label ? null : item);
  };

  const handleBackdropPress = () => {
    setActiveMenuItem(null);
  };

  return (
    <View style={styles.container}>
      <TopBar />
      <View style={styles.contentWrapper}>
        <Sidebar onMenuSelect={handleMenuSelect} />
        {activeMenuItem && (
          <>
            <TouchableWithoutFeedback onPress={handleBackdropPress}>
              <View style={styles.backdrop} />
            </TouchableWithoutFeedback>
            <SubMenu item={activeMenuItem} />
          </>
        )}
        <View style={[styles.content, activeMenuItem && styles.contentWithOverlay]}>
          <Breadcrumb items={breadcrumbs} />
          {toolbarContent && (
            <View style={styles.toolbar}>
              {toolbarContent}
            </View>
          )}
          <View style={styles.mainContent}>
            {children}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  contentWithOverlay: {
    opacity: 0.7,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 60,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  mainContent: {
    flex: 1,
  },
}); 