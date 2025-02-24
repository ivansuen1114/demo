import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CrewMember, Team, RosterEntry } from '../types';
import { COLORS } from '../constants/colors';

type CrewPosition = 'Leader' | 'Driver' | 'Guard';

interface TeamDayEditModalProps {
  visible: boolean;
  onClose: () => void;
  date: string;
  team: Team;
  availableMembers: CrewMember[];
  onUpdateTeam: (updates: {
    leaderId?: string;
    driverId?: string;
    guardIds?: string[];
  }) => void;
}

export default function TeamDayEditModal({
  visible,
  onClose,
  date,
  team,
  availableMembers,
  onUpdateTeam,
}: TeamDayEditModalProps) {
  const [selectedPosition, setSelectedPosition] = useState<CrewPosition>('Leader');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const filteredMembers = useMemo(() => {
    return availableMembers.filter(member => {
      switch (selectedPosition) {
        case 'Leader':
          return member.type === 'Leader' || member.type === 'Senior Crew Leader';
        case 'Driver':
          return member.type === 'Driver';
        case 'Guard':
          return member.type === 'Guard';
        default:
          return false;
      }
    });
  }, [availableMembers, selectedPosition]);

  const handlePositionSelect = (position: CrewPosition) => {
    setSelectedPosition(position);
    setSelectedMemberId(null);
  };

  const handleMemberSelect = (memberId: string) => {
    setSelectedMemberId(memberId);
  };

  const handleConfirm = () => {
    if (!selectedMemberId) return;

    switch (selectedPosition) {
      case 'Leader':
        onUpdateTeam({ leaderId: selectedMemberId });
        break;
      case 'Driver':
        onUpdateTeam({ driverId: selectedMemberId });
        break;
      case 'Guard':
        const currentGuardIds = team.guards.map(g => g.id);
        onUpdateTeam({ guardIds: [...currentGuardIds, selectedMemberId] });
        break;
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Update Team for {new Date(date).toLocaleDateString()}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {/* Position Filter */}
            <View style={styles.positionFilter}>
              {(['Leader', 'Driver', 'Guard'] as CrewPosition[]).map(position => (
                <TouchableOpacity
                  key={position}
                  style={[
                    styles.positionButton,
                    selectedPosition === position && styles.positionButtonActive
                  ]}
                  onPress={() => handlePositionSelect(position)}
                >
                  <Text style={[
                    styles.positionButtonText,
                    selectedPosition === position && styles.positionButtonTextActive
                  ]}>
                    {position}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Available Members List */}
            <ScrollView style={styles.membersList}>
              {filteredMembers.map(member => (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.memberItem,
                    selectedMemberId === member.id && styles.memberItemSelected
                  ]}
                  onPress={() => handleMemberSelect(member.id)}
                >
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberType}>{member.type}</Text>
                </TouchableOpacity>
              ))}
              {filteredMembers.length === 0 && (
                <Text style={styles.noMembers}>No available members</Text>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.confirmButton,
                  !selectedMemberId && styles.confirmButtonDisabled
                ]}
                onPress={handleConfirm}
                disabled={!selectedMemberId}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
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
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  positionFilter: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  positionButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: 'center',
  },
  positionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  positionButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  positionButtonTextActive: {
    color: '#FFF',
  },
  membersList: {
    maxHeight: 400,
  },
  memberItem: {
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: 8,
  },
  memberItemSelected: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  memberType: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  noMembers: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    padding: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.background,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  confirmButtonDisabled: {
    backgroundColor: COLORS.divider,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
}); 