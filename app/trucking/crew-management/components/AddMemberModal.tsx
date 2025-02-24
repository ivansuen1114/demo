import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { Text } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CrewMember } from '../types';

interface AddMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (member: Omit<CrewMember, 'id'>) => void;
  initialData?: CrewMember | null;
}

export default function AddMemberModal({ 
  visible, 
  onClose, 
  onSave,
  initialData 
}: AddMemberModalProps) {
  const [formData, setFormData] = useState({
    staffId: '',
    name: '',
    type: 'Driver' as CrewMember['type'],
    phone: '',
    email: '',
    joinedDate: new Date().toISOString().split('T')[0],
    isGunCertified: false,
    skills: [] as string[],
    documents: [] as CrewMember['documents']
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newSkill, setNewSkill] = useState('');
  const [newDocument, setNewDocument] = useState({
    type: '',
    number: '',
    expiryDate: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        staffId: initialData.staffId,
        name: initialData.name,
        type: initialData.type,
        phone: initialData.phone,
        email: initialData.email,
        joinedDate: initialData.joinedDate,
        isGunCertified: initialData.isGunCertified,
        skills: [...initialData.skills],
        documents: [...initialData.documents]
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.staffId.trim()) {
      newErrors.staffId = 'Please enter staff ID';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Please enter name';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Please enter phone number';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    return newErrors;
  };

  const handleSave = () => {
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSave({
        ...formData,
        status: 'Active'
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      staffId: '',
      name: '',
      type: 'Driver',
      phone: '',
      email: '',
      joinedDate: new Date().toISOString().split('T')[0],
      isGunCertified: false,
      skills: [],
      documents: []
    });
    setErrors({});
    setNewSkill('');
    setNewDocument({ type: '', number: '', expiryDate: '' });
    onClose();
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const addDocument = () => {
    if (newDocument.type.trim() && newDocument.number.trim() && newDocument.expiryDate) {
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, { ...newDocument }]
      }));
      setNewDocument({ type: '', number: '', expiryDate: '' });
    }
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {initialData ? 'Edit Member' : 'Add New Member'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Staff ID</Text>
                <TextInput
                  style={[styles.input, errors.staffId && styles.inputError]}
                  value={formData.staffId}
                  onChangeText={value => setFormData(prev => ({ ...prev, staffId: value }))}
                  placeholder="Enter staff ID"
                  placeholderTextColor="#999"
                />
                {errors.staffId && <Text style={styles.errorText}>{errors.staffId}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={formData.name}
                  onChangeText={value => setFormData(prev => ({ ...prev, name: value }))}
                  placeholder="Enter name"
                  placeholderTextColor="#999"
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Position</Text>
                <View style={styles.typeSelector}>
                  {(['Senior Crew Leader', 'Leader', 'Driver', 'Guard'] as const).map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        formData.type === type && styles.typeButtonSelected
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, type }))}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        formData.type === type && styles.typeButtonTextSelected
                      ]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  value={formData.phone}
                  onChangeText={value => setFormData(prev => ({ ...prev, phone: value }))}
                  placeholder="Enter phone number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={formData.email}
                  onChangeText={value => setFormData(prev => ({ ...prev, email: value }))}
                  placeholder="Enter email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Join Date</Text>
                <TextInput
                  style={styles.input}
                  value={formData.joinedDate}
                  onChangeText={value => setFormData(prev => ({ ...prev, joinedDate: value }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.checkboxGroup}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setFormData(prev => ({ 
                    ...prev, 
                    isGunCertified: !prev.isGunCertified 
                  }))}
                >
                  <MaterialCommunityIcons
                    name={formData.isGunCertified ? "checkbox-marked" : "checkbox-blank-outline"}
                    size={24}
                    color={formData.isGunCertified ? "#1976D2" : "#666"}
                  />
                  <Text style={styles.checkboxLabel}>Gun License</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Skills */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Skills</Text>
              <View style={styles.skillsContainer}>
                {formData.skills.map((skill, index) => (
                  <View key={index} style={styles.skillChip}>
                    <Text style={styles.skillChipText}>{skill}</Text>
                    <TouchableOpacity onPress={() => removeSkill(skill)}>
                      <MaterialCommunityIcons name="close" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.addSkillContainer}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={newSkill}
                  onChangeText={setNewSkill}
                  placeholder="Add new skill"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.addButton} onPress={addSkill}>
                  <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Documents */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Documents</Text>
              {formData.documents.map((doc, index) => (
                <View key={index} style={styles.documentCard}>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentType}>{doc.type}</Text>
                    <Text style={styles.documentNumber}>{doc.number}</Text>
                    <Text style={styles.documentExpiry}>Expires: {doc.expiryDate}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeDocument(index)}>
                    <MaterialCommunityIcons name="delete-outline" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.addDocumentContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  value={newDocument.type}
                  onChangeText={value => setNewDocument(prev => ({ ...prev, type: value }))}
                  placeholder="Document type"
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  value={newDocument.number}
                  onChangeText={value => setNewDocument(prev => ({ ...prev, number: value }))}
                  placeholder="Document number"
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  value={newDocument.expiryDate}
                  onChangeText={value => setNewDocument(prev => ({ ...prev, expiryDate: value }))}
                  placeholder="Expiry date"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.addButton} onPress={addDocument}>
                  <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
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
    maxWidth: 800,
    maxHeight: '90%',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#D32F2F',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  typeButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
  },
  typeButtonText: {
    color: '#666',
    fontSize: 14,
  },
  typeButtonTextSelected: {
    color: '#1976D2',
    fontWeight: '500',
  },
  checkboxGroup: {
    marginTop: 8,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    gap: 4,
  },
  skillChipText: {
    fontSize: 14,
    color: '#333',
  },
  addSkillContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    marginBottom: 8,
  },
  documentInfo: {
    flex: 1,
  },
  documentType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  documentNumber: {
    fontSize: 14,
    color: '#666',
  },
  documentExpiry: {
    fontSize: 12,
    color: '#666',
  },
  addDocumentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#1976D2',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
}); 