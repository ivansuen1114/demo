import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Text } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Shift {
  id: string;
  type: 'Day' | 'Normal' | 'Night';
  startTime: string;
  endTime: string;
  color: string;
  capacity: number;
}

interface ShiftManagerProps {
  shifts: Shift[];
  onShiftUpdate: (shifts: Shift[]) => void;
}

interface ShiftFormData {
  id: string;
  type: 'Day' | 'Normal' | 'Night';
  startTime: string;
  endTime: string;
  color: string;
  capacity: number;
}

const COLORS = [
  '#E3F2FD', '#E8F5E9', '#FFF3E0', '#F3E5F5', 
  '#E1F5FE', '#F1F8E9', '#FFF8E1', '#FCE4EC'
];

const TimePickerCustom = ({ 
  value, 
  onChange,
  onConfirm,
  onCancel
}: { 
  value: { hours: number; minutes: number }; 
  onChange: (value: { hours: number; minutes: number }) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  return (
    <View>
      <View style={styles.timePickerCustom}>
        <View style={styles.timePickerSection}>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => onChange({ 
              ...value, 
              hours: (value.hours + 1) % 24 
            })}
          >
            <MaterialCommunityIcons name="chevron-up" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.timeValue}>
            {value.hours.toString().padStart(2, '0')}
          </Text>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => onChange({ 
              ...value, 
              hours: (value.hours - 1 + 24) % 24 
            })}
          >
            <MaterialCommunityIcons name="chevron-down" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.timeSeparator}>:</Text>
        
        <View style={styles.timePickerSection}>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => onChange({ 
              ...value, 
              minutes: (value.minutes + 15) % 60 
            })}
          >
            <MaterialCommunityIcons name="chevron-up" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.timeValue}>
            {value.minutes.toString().padStart(2, '0')}
          </Text>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => onChange({ 
              ...value, 
              minutes: (value.minutes - 15 + 60) % 60 
            })}
          >
            <MaterialCommunityIcons name="chevron-down" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.timePickerActions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={onConfirm}
        >
          <Text style={styles.saveButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function ShiftManager({ shifts, onShiftUpdate }: ShiftManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftFormData | null>(null);
  const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setShowModal(true);
  };

  const handleAddShift = () => {
    setEditingShift({
      id: `shift_${Date.now()}`,
      type: 'Day',
      startTime: '09:00',
      endTime: '17:00',
      color: COLORS[0],
      capacity: 1
    });
    setShowModal(true);
  };

  const handleSaveShift = () => {
    if (!editingShift) return;

    const updatedShifts = editingShift.id
      ? shifts.map(s => s.id === editingShift.id ? editingShift : s)
      : [...shifts, editingShift];

    onShiftUpdate(updatedShifts);
    setShowModal(false);
    setEditingShift(null);
  };

  const handleDeleteShift = (shiftId: string) => {
    const updatedShifts = shifts.filter(s => s.id !== shiftId);
    onShiftUpdate(updatedShifts);
  };

  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  };

  const formatTime = (hours: number, minutes: number) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons name="clock-outline" size={20} color="#1976D2" />
          <Text style={styles.title}>Shift Settings</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddShift}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
          <Text style={styles.addButtonText}>Add Shift</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.shiftList}>
        {shifts.map(shift => (
          <View key={shift.id} style={styles.shiftCard}>
            <View style={[styles.shiftColorBar, { backgroundColor: shift.color }]} />
            <View style={styles.shiftContent}>
              <View style={styles.shiftHeader}>
                <Text style={styles.shiftType}>{shift.type}</Text>
                <View style={styles.shiftActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleEditShift(shift)}
                  >
                    <MaterialCommunityIcons name="pencil" size={16} color="#1976D2" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleDeleteShift(shift.id)}
                  >
                    <MaterialCommunityIcons name="delete" size={16} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.shiftDetails}>
                <View style={styles.timeRow}>
                  <MaterialCommunityIcons name="clock-start" size={16} color="#666" />
                  <Text style={styles.timeText}>{shift.startTime}</Text>
                  <MaterialCommunityIcons name="arrow-right" size={16} color="#666" />
                  <Text style={styles.timeText}>{shift.endTime}</Text>
                </View>
                <View style={styles.capacityRow}>
                  <MaterialCommunityIcons name="account-group" size={16} color="#666" />
                  <Text style={styles.capacityText}>Capacity: {shift.capacity}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingShift?.id ? 'Edit Shift' : 'Add New Shift'}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {editingShift && (
              <View style={styles.form}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Shift Type</Text>
                  <View style={styles.typeButtons}>
                    {(['Day', 'Normal', 'Night'] as const).map(type => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeButton,
                          editingShift.type === type && styles.typeButtonSelected
                        ]}
                        onPress={() => setEditingShift({ ...editingShift, type })}
                      >
                        <Text style={[
                          styles.typeButtonText,
                          editingShift.type === type && styles.typeButtonTextSelected
                        ]}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Time Range</Text>
                  <View style={styles.timeInputs}>
                    <TouchableOpacity
                      style={styles.timeInput}
                      onPress={() => setShowTimePicker('start')}
                    >
                      <MaterialCommunityIcons name="clock-start" size={20} color="#666" />
                      <Text style={styles.timeInputText}>{editingShift.startTime}</Text>
                    </TouchableOpacity>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#666" />
                    <TouchableOpacity
                      style={styles.timeInput}
                      onPress={() => setShowTimePicker('end')}
                    >
                      <MaterialCommunityIcons name="clock-end" size={20} color="#666" />
                      <Text style={styles.timeInputText}>{editingShift.endTime}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Color</Text>
                  <View style={styles.colorPicker}>
                    {COLORS.map(color => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          editingShift.color === color && styles.colorOptionSelected
                        ]}
                        onPress={() => setEditingShift({ ...editingShift, color })}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Capacity</Text>
                  <View style={styles.capacityInput}>
                    <TouchableOpacity
                      style={styles.capacityButton}
                      onPress={() => setEditingShift({
                        ...editingShift,
                        capacity: Math.max(1, editingShift.capacity - 1)
                      })}
                    >
                      <MaterialCommunityIcons name="minus" size={20} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.capacityValue}>{editingShift.capacity}</Text>
                    <TouchableOpacity
                      style={styles.capacityButton}
                      onPress={() => setEditingShift({
                        ...editingShift,
                        capacity: editingShift.capacity + 1
                      })}
                    >
                      <MaterialCommunityIcons name="plus" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => setShowModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={handleSaveShift}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {showTimePicker && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTimePicker(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.timePickerModal}>
              <View style={styles.timePickerHeader}>
                <Text style={styles.timePickerTitle}>
                  Select {showTimePicker === 'start' ? 'Start' : 'End'} Time
                </Text>
                <TouchableOpacity onPress={() => setShowTimePicker(null)}>
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              {editingShift && (
                <TimePickerCustom
                  value={parseTime(
                    showTimePicker === 'start' 
                      ? editingShift.startTime 
                      : editingShift.endTime
                  )}
                  onChange={({ hours, minutes }) => {
                    if (!editingShift) return;
                    const timeStr = formatTime(hours, minutes);
                    setEditingShift({
                      ...editingShift,
                      [showTimePicker === 'start' ? 'startTime' : 'endTime']: timeStr
                    });
                  }}
                  onConfirm={() => setShowTimePicker(null)}
                  onCancel={() => setShowTimePicker(null)}
                />
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 4,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  shiftList: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  shiftCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  shiftColorBar: {
    width: 4,
  },
  shiftContent: {
    flex: 1,
    padding: 12,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  shiftActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  shiftDetails: {
    gap: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  capacityText: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  typeButtonSelected: {
    backgroundColor: '#E3F2FD',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  typeButtonTextSelected: {
    color: '#1976D2',
    fontWeight: '500',
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  timeInputText: {
    fontSize: 14,
    color: '#333',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#1976D2',
  },
  capacityInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  capacityButton: {
    padding: 8,
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  capacityValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    minWidth: 24,
    textAlign: 'center',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  timePickerModal: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timePickerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timePickerCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  timePickerSection: {
    alignItems: 'center',
    gap: 8,
  },
  timeButton: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 40,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  timePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 16,
  },
  button: {
    padding: 8,
    borderRadius: 4,
  },
}); 