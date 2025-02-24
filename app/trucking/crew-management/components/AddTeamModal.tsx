import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { Text } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Team, CrewMember } from '../types';

interface AddTeamModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (team: Omit<Team, 'id' | 'createdAt'>) => void;
  availableMembers: CrewMember[];
  initialData?: Team | null;
  mode?: 'create' | 'edit';
}

export default function AddTeamModal({
  visible,
  onClose,
  onSave,
  availableMembers,
  initialData,
  mode = 'create'
}: AddTeamModalProps) {
  const [teamName, setTeamName] = useState('');
  const [defaultTruckId, setDefaultTruckId] = useState('');
  const [selectedLeader, setSelectedLeader] = useState<CrewMember | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<CrewMember | null>(null);
  const [selectedGuards, setSelectedGuards] = useState<CrewMember[]>([]);
  const [showMemberSelect, setShowMemberSelect] = useState<'leader' | 'driver' | 'guard' | null>(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (initialData && visible) {
      setTeamName(initialData.name);
      setDefaultTruckId(initialData.defaultTruckId || '');
      setSelectedLeader(initialData.leader);
      setSelectedDriver(initialData.driver);
      setSelectedGuards(initialData.guards);
    }
  }, [initialData, visible]);

  // 按职位筛选可用成员
  const availableLeaders = useMemo(() => 
    availableMembers.filter(m => m.type === 'Senior Crew Leader' || m.type === 'Leader')
  , [availableMembers]);

  const availableDrivers = useMemo(() => 
    availableMembers.filter(m => m.type === 'Driver')
  , [availableMembers]);

  const availableGuards = useMemo(() => 
    availableMembers.filter(m => 
      m.type === 'Guard' && !selectedGuards.find(g => g.id === m.id)
    )
  , [availableMembers, selectedGuards]);

  const handleSave = () => {
    if (!teamName.trim() || !selectedDriver) {
      Alert.alert('Error', 'Team name and driver are required');
      return;
    }

      onSave({
        name: teamName.trim(),
        leader: selectedLeader,
        driver: selectedDriver,
      guards: selectedGuards,
        defaultTruckId: defaultTruckId.trim() || undefined,
        status: 'Active'
      });

    // Reset form
    setTeamName('');
    setDefaultTruckId('');
    setSelectedLeader(null);
    setSelectedDriver(null);
    setSelectedGuards([]);
    onClose();
  };

  const handleRemoveGuard = (guardId: string) => {
    setSelectedGuards(prev => prev.filter(g => g.id !== guardId));
  };

  const renderMemberSelector = () => {
    if (!showMemberSelect) return null;

    let availableList: CrewMember[] = [];
    let title = '';

    switch (showMemberSelect) {
      case 'leader':
        availableList = availableLeaders;
        title = 'Select Team Leader';
        break;
      case 'driver':
        availableList = availableDrivers;
        title = 'Select Driver';
        break;
      case 'guard':
        availableList = availableGuards;
        title = 'Select Guards';
        break;
    }

    const filteredList = availableList.filter(member =>
      member.name.toLowerCase().includes(searchText.toLowerCase()) ||
      member.staffId.toLowerCase().includes(searchText.toLowerCase())
    );

    if (showMemberSelect === 'guard') {
      return (
        <View style={styles.selectorOverlay}>
          <View style={styles.selectorContent}>
            <View style={styles.selectorHeader}>
              <Text style={styles.selectorTitle}>{title}</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowMemberSelect(null);
                  setSearchText('');
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search by name or ID..."
                placeholderTextColor="#999"
              />
            </View>

            <ScrollView style={styles.memberList}>
              {filteredList.map(member => (
                <TouchableOpacity
                  key={member.id}
                  style={styles.memberItem}
                  onPress={() => {
                    setSelectedGuards(prev => [...prev, member]);
                    setSearchText('');
                  }}
                >
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberDetail}>
                      {member.staffId} • {member.type}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="plus-circle" size={20} color="#1976D2" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.selectorOverlay}>
        <View style={styles.selectorContent}>
          <View style={styles.selectorHeader}>
        <Text style={styles.selectorTitle}>{title}</Text>
          <TouchableOpacity
              onPress={() => {
                setShowMemberSelect(null);
                setSearchText('');
              }}
            >
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search by name or ID..."
              placeholderTextColor="#999"
            />
          </View>

          <ScrollView style={styles.memberList}>
            {filteredList.map(member => (
            <TouchableOpacity
              key={member.id}
                style={styles.memberItem}
                onPress={() => {
                  switch (showMemberSelect) {
                    case 'leader':
                      setSelectedLeader(member);
                      break;
                    case 'driver':
                      setSelectedDriver(member);
                      break;
                    case 'guard':
                      setSelectedGuards(prev => [...prev, member]);
                      break;
                  }
                  setShowMemberSelect(null);
                  setSearchText('');
                }}
              >
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberDetail}>
                    {member.staffId} • {member.type}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>
          ))}
        </ScrollView>
        </View>
      </View>
    );
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
            <View style={styles.titleContainer}>
              <MaterialCommunityIcons 
                name="account-group-outline" 
                size={24} 
                color="#1976D2" 
              />
              <Text style={styles.modalTitle}>
                {mode === 'create' ? 'Create New Team' : 'Edit Team'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.formContainer}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="information" size={20} color="#1976D2" />
                  <Text style={styles.sectionTitle}>Basic Information</Text>
                </View>
            <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    <MaterialCommunityIcons name="tag-outline" size={18} color="#666" />
                    {" Team Name"}
                  </Text>
                  <View style={styles.inputContainer}>
              <TextInput
                      style={styles.input}
                value={teamName}
                onChangeText={setTeamName}
                placeholder="Enter team name"
                placeholderTextColor="#999"
              />
                  </View>
            </View>

            <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    <MaterialCommunityIcons name="truck" size={18} color="#666" />
                    {" Default Truck ID"} <Text style={styles.optional}>(Optional)</Text>
                  </Text>
                  <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={defaultTruckId}
                onChangeText={setDefaultTruckId}
                      placeholder="Enter default truck ID"
                placeholderTextColor="#999"
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="account-group" size={20} color="#1976D2" />
                  <Text style={styles.sectionTitle}>Team Members</Text>
                </View>
                <View style={styles.memberSelections}>
                  <View style={styles.memberSelection}>
                    <Text style={styles.label}>
                      <MaterialCommunityIcons name="account-star" size={18} color="#666" />
                      {" Team Leader"} <Text style={styles.optional}>(Optional)</Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.memberSelectButton,
                        selectedLeader && styles.memberSelectButtonSelected
                      ]}
                      onPress={() => setShowMemberSelect('leader')}
                    >
                      {selectedLeader ? (
                        <View style={styles.selectedMember}>
                          <View style={styles.memberIconContainer}>
                            <MaterialCommunityIcons name="account-circle" size={32} color="#1976D2" />
                          </View>
                          <View style={styles.selectedMemberInfo}>
                            <Text style={styles.selectedMemberName}>{selectedLeader.name}</Text>
                            <Text style={styles.selectedMemberType}>{selectedLeader.type}</Text>
                          </View>
                        </View>
                      ) : (
                        <>
                          <MaterialCommunityIcons name="account-plus" size={24} color="#666" />
                          <Text style={styles.placeholderText}>Select Team Leader</Text>
                        </>
                      )}
                      <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.memberSelection}>
                    <Text style={styles.label}>
                      <MaterialCommunityIcons name="steering" size={18} color="#666" />
                      {" Driver"} <Text style={styles.required}>(Required)</Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.memberSelectButton,
                        selectedDriver && styles.memberSelectButtonSelected,
                        !selectedDriver && styles.memberSelectButtonRequired
                      ]}
                      onPress={() => setShowMemberSelect('driver')}
                    >
                      {selectedDriver ? (
                        <View style={styles.selectedMember}>
                          <View style={styles.memberIconContainer}>
                            <MaterialCommunityIcons name="account-circle" size={32} color="#1976D2" />
                          </View>
                          <View style={styles.selectedMemberInfo}>
                            <Text style={styles.selectedMemberName}>{selectedDriver.name}</Text>
                            <Text style={styles.selectedMemberType}>{selectedDriver.type}</Text>
                          </View>
                        </View>
                      ) : (
                        <>
                          <MaterialCommunityIcons name="account-plus" size={24} color="#666" />
                          <Text style={styles.placeholderText}>Select Driver</Text>
                        </>
                      )}
                      <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.memberSelection}>
                    <Text style={styles.label}>
                      <MaterialCommunityIcons name="shield-account" size={18} color="#666" />
                      {" Guards"} <Text style={styles.optional}>(Optional)</Text>
                    </Text>
                    <View style={styles.selectedGuardsContainer}>
                      {selectedGuards.map(guard => (
                        <View key={guard.id} style={styles.selectedGuardChip}>
                          <View style={styles.memberIconContainer}>
                            <MaterialCommunityIcons name="account-circle" size={24} color="#1976D2" />
                          </View>
                          <Text style={styles.selectedGuardName}>{guard.name}</Text>
                          <TouchableOpacity
                            style={styles.removeGuardButton}
                            onPress={() => handleRemoveGuard(guard.id)}
                          >
                            <MaterialCommunityIcons name="close-circle" size={20} color="#666" />
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity
                        style={styles.addGuardButton}
                        onPress={() => setShowMemberSelect('guard')}
                      >
                        <MaterialCommunityIcons name="plus" size={24} color="#1976D2" />
                        <Text style={styles.addGuardText}>Add Guard</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <MaterialCommunityIcons name="close" size={18} color="#666" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <MaterialCommunityIcons 
                name={mode === 'create' ? 'plus' : 'content-save'} 
                size={18} 
                color="#FFF" 
              />
              <Text style={styles.saveButtonText}>
                {mode === 'create' ? 'Create Team' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {renderMemberSelector()}
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
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
    flex: 1,
  },
  formContainer: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    backgroundColor: '#FFF',
    padding: 4,
  },
  input: {
    fontSize: 16,
    color: '#333',
    padding: 8,
  },
  memberSelections: {
    gap: 20,
  },
  memberSelection: {
    gap: 8,
  },
  memberSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFF',
    gap: 12,
  },
  memberSelectButtonSelected: {
    borderColor: '#1976D2',
    backgroundColor: '#F5F9FF',
    borderWidth: 2,
  },
  selectedMember: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedMemberInfo: {
    flex: 1,
  },
  selectedMemberName: {
    fontSize: 16,
    color: '#333',
  },
  selectedMemberType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    minWidth: 120,
    justifyContent: 'center',
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
  selectorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorContent: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  memberList: {
    maxHeight: 400,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  memberDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  required: {
    color: '#D32F2F',
    fontSize: 12,
  },
  optional: {
    color: '#666',
    fontSize: 12,
  },
  memberSelectButtonRequired: {
    borderColor: '#FFE0E0',
    borderWidth: 2,
  },
  selectedGuardsContainer: {
    gap: 8,
  },
  selectedGuardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F9FF',
    borderRadius: 20,
    padding: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  selectedGuardName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  removeGuardButton: {
    padding: 4,
  },
  addGuardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#1976D2',
    borderRadius: 8,
    gap: 8,
  },
  addGuardText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '500',
  },
}); 