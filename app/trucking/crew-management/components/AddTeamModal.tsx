import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { Text } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Team, CrewMember } from '../types';

interface AddTeamModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (team: Omit<Team, 'id' | 'createdAt'>) => void;
  availableMembers: CrewMember[];
}

export default function AddTeamModal({ visible, onClose, onSave, availableMembers }: AddTeamModalProps) {
  const [teamName, setTeamName] = useState('');
  const [selectedLeader, setSelectedLeader] = useState<CrewMember | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<CrewMember | null>(null);
  const [selectedGuard, setSelectedGuard] = useState<CrewMember | null>(null);
  const [defaultTruckId, setDefaultTruckId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const newErrors: Record<string, string> = {};

    if (!teamName.trim()) {
      newErrors.teamName = 'Please enter team name';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSave({
        name: teamName.trim(),
        leader: selectedLeader,
        driver: selectedDriver,
        guard: selectedGuard,
        defaultTruckId: defaultTruckId.trim() || undefined,
        status: 'Active'
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setTeamName('');
    setSelectedLeader(null);
    setSelectedDriver(null);
    setSelectedGuard(null);
    setDefaultTruckId('');
    setErrors({});
    onClose();
  };

  const renderMemberSelector = (
    title: string,
    type: 'Leader' | 'Driver' | 'Guard',
    selected: CrewMember | null,
    onSelect: (member: CrewMember | null) => void
  ) => {
    const availableForType = availableMembers.filter(m => 
      m.type === type && 
      m.status === 'Active' &&
      m !== selectedLeader && 
      m !== selectedDriver && 
      m !== selectedGuard
    );

    return (
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorTitle}>{title}</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.memberScroll}
        >
          <TouchableOpacity
            style={[
              styles.memberCard,
              !selected && styles.memberCardSelected
            ]}
            onPress={() => onSelect(null)}
          >
            <MaterialCommunityIcons 
              name="account-off-outline" 
              size={24} 
              color={!selected ? '#1976D2' : '#666'} 
            />
            <Text style={[
              styles.memberCardText,
              !selected && styles.memberCardTextSelected
            ]}>
              Not Assigned
            </Text>
          </TouchableOpacity>

          {availableForType.map(member => (
            <TouchableOpacity
              key={member.id}
              style={[
                styles.memberCard,
                selected?.id === member.id && styles.memberCardSelected
              ]}
              onPress={() => onSelect(member)}
            >
              <View style={styles.memberCardContent}>
                <MaterialCommunityIcons 
                  name="account" 
                  size={24} 
                  color={selected?.id === member.id ? '#1976D2' : '#666'} 
                />
                <View>
                  <Text style={[
                    styles.memberCardText,
                    selected?.id === member.id && styles.memberCardTextSelected
                  ]}>
                    {member.name}
                  </Text>
                  <Text style={styles.memberCardSubtext}>
                    {member.staffId}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
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
            <Text style={styles.modalTitle}>Create New Team</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Team Name</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.teamName && styles.inputError
                ]}
                value={teamName}
                onChangeText={setTeamName}
                placeholder="Enter team name"
                placeholderTextColor="#999"
              />
              {errors.teamName && (
                <Text style={styles.errorText}>{errors.teamName}</Text>
              )}
            </View>

            {renderMemberSelector('Select Leader', 'Leader', selectedLeader, setSelectedLeader)}
            {renderMemberSelector('Select Driver', 'Driver', selectedDriver, setSelectedDriver)}
            {renderMemberSelector('Select Guard', 'Guard', selectedGuard, setSelectedGuard)}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Default Vehicle ID (Optional)</Text>
              <TextInput
                style={styles.input}
                value={defaultTruckId}
                onChangeText={setDefaultTruckId}
                placeholder="Enter vehicle ID"
                placeholderTextColor="#999"
              />
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
              <Text style={styles.saveButtonText}>Create Team</Text>
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
  inputGroup: {
    marginBottom: 20,
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
  selectorContainer: {
    marginBottom: 20,
  },
  selectorTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  memberScroll: {
    flexGrow: 0,
  },
  memberCard: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 12,
    marginRight: 8,
    minWidth: 120,
  },
  memberCardSelected: {
    borderColor: '#1976D2',
    backgroundColor: '#E3F2FD',
  },
  memberCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberCardText: {
    fontSize: 14,
    color: '#333',
  },
  memberCardTextSelected: {
    color: '#1976D2',
    fontWeight: '500',
  },
  memberCardSubtext: {
    fontSize: 12,
    color: '#666',
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