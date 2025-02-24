import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, Alert, Platform } from 'react-native';
import { Text } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

interface AddMethodModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectManual: () => void;
  onBulkCreate: (data: string) => void;
}

export default function AddMethodModal({
  visible,
  onClose,
  onSelectManual,
  onBulkCreate
}: AddMethodModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const template = `Staff ID,Name,Position,Phone,Email,Join Date,Gun License,Skills,Document Types,Document Numbers,Document Expiry Dates,PDA Username,PDA Password
# For multiple documents, separate them with commas and wrap in quotes. Example: "License,Permit" for Document Types
# Make sure the number of types, numbers and expiry dates match
CR001,John Doe,Senior Crew Leader,+852 1234 5678,john@example.com,2024-01-01,YES,"Team Management,Route Planning","License,Security Permit","L123456,P789012","2024-12-31,2024-06-30",john.doe,password123
CR002,Jane Smith,Driver,+852 2345 6789,jane@example.com,2024-01-02,NO,"Heavy Vehicle,City Navigation",Driver License,DL789012,2024-10-15,jane.smith,pass456`;

  const handleDownloadTemplate = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web 环境下使用 Blob 和 URL.createObjectURL
        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'crew_template.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // 移动设备环境
        const fileUri = `${FileSystem.documentDirectory}crew_template.csv`;
        await FileSystem.writeAsStringAsync(fileUri, template);
        
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Download Crew Template',
            UTI: 'public.comma-separated-values-text'
          });
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      Alert.alert('Error', 'Failed to download template');
    }
  };

  const handleUploadExcel = async () => {
    try {
      setIsProcessing(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel']
      });

      if (result.assets && result.assets[0]) {
        if (Platform.OS === 'web') {
          // Web 环境下读取文件内容
          const response = await fetch(result.assets[0].uri);
          const fileContent = await response.text();
          onBulkCreate(fileContent);
        } else {
          // 移动设备环境
          const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
          onBulkCreate(fileContent);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Crew Members</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.options}>
            <TouchableOpacity 
              style={styles.option}
              onPress={onSelectManual}
            >
              <MaterialCommunityIcons name="account-plus" size={32} color="#1976D2" />
              <Text style={styles.optionTitle}>Manual Add</Text>
              <Text style={styles.optionDescription}>Add crew members one by one</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.option}>
              <MaterialCommunityIcons name="file-excel" size={32} color="#1976D2" />
              <Text style={styles.optionTitle}>Bulk Create via Excel</Text>
              <Text style={styles.optionDescription}>Import multiple crew members at once</Text>
              
              <View style={styles.excelButtons}>
                <TouchableOpacity 
                  style={[styles.button, styles.downloadButton]}
                  onPress={handleDownloadTemplate}
                >
                  <MaterialCommunityIcons name="download" size={20} color="#1976D2" />
                  <Text style={styles.downloadButtonText}>Download Template</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.button, 
                    styles.uploadButton,
                    isProcessing && styles.buttonDisabled
                  ]}
                  onPress={handleUploadExcel}
                  disabled={isProcessing}
                >
                  <MaterialCommunityIcons 
                    name={isProcessing ? "loading" : "upload"} 
                    size={20} 
                    color="#FFF" 
                  />
                  <Text style={styles.uploadButtonText}>
                    {isProcessing ? 'Processing...' : 'Upload Excel'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    width: '90%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  options: {
    padding: 24,
    gap: 24,
  },
  option: {
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F5F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  excelButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    minWidth: 120,
  },
  downloadButton: {
    backgroundColor: '#E3F2FD',
  },
  downloadButtonText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '500',
  },
  uploadButton: {
    backgroundColor: '#1976D2',
  },
  uploadButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
}); 