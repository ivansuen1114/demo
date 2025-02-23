import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from './Themed';

interface TopBarProps {
  onMenuPress?: () => void;
}

export default function TopBar({ onMenuPress }: TopBarProps) {
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <View style={styles.leftSection}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={onMenuPress}
          >
            
          </TouchableOpacity>
          <View style={styles.titleWrapper}>
            <Text style={styles.titleBold}>Demo</Text>
            <Text style={styles.titleNormal}>        For Demostration the function an UI/UX Design</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowNotifications(!showNotifications)}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color="#000" /> 
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowLanguageModal(true)}
          >
            <MaterialCommunityIcons name="web" size={24} color="#000" />
            <Text style={styles.languageText}>EN</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowUserMenu(!showUserMenu)}
          >
            <MaterialCommunityIcons name="account-circle" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.languageOption}>
              <Text>English</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.languageOption}>
              <Text>中文</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8bc28',
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  titleContainer: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  menuButton: {
    padding: 5,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleBold: {
    fontSize: 26,
    fontWeight: '900',
    color: '#000',
  },
  titleNormal: {
    fontSize: 20,
    fontWeight: 'normal',
    color: '#000',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  languageText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    minWidth: 150,
  },
  languageOption: {
    padding: 10,
  },
}); 