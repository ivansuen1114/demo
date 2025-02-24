import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CrewMember, RosterEntry, Shift, LeaveType, Team } from '../types';
import { calendarStyles } from '../utils/calendarStyles';
import { COLORS } from '../constants/colors';
import { getShiftColor, getShiftTextColor } from '../utils/shiftColors';

interface PersonalRosterCalendarProps {
  member: CrewMember;
  roster: RosterEntry[];
  shifts: Shift[];
  teams: Team[];
  onAddLeave: (date: string, leaveType: LeaveType) => void;
  onRemoveLeave: (rosterId: string) => void;
}

export default function PersonalRosterCalendar({
  member,
  roster,
  shifts,
  teams,
  onAddLeave,
  onRemoveLeave
}: PersonalRosterCalendarProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const { daysInMonth, firstDayOfMonth } = getDaysInMonth(selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getShiftForDate = (day: number) => {
    const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
      .toISOString().split('T')[0];
    const foundRoster = roster.find(r => r.date === date);
    console.log('Date:', date, 'Roster:', foundRoster, 'All roster:', roster);
    return foundRoster;
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + increment);
    setSelectedMonth(newDate);
  };

  const isWeekend = (day: number) => {
    const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const isPastDay = (day: number) => {
    const today = new Date();
    const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    return date < new Date(today.setHours(0, 0, 0, 0));
  };

  const isToday = (day: number) => {
    const today = new Date();
    const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    return date.toDateString() === today.toDateString();
  };

  const getLeaveStyle = (leaveType?: LeaveType) => {
    if (!leaveType) return {};
    
    switch (leaveType) {
      case 'Annual Leave':
        return {
          background: COLORS.annualLeaveBackground,
          text: COLORS.annualLeaveText
        };
      case 'Compensation Leave':
        return {
          background: COLORS.compensationLeaveBackground,
          text: COLORS.compensationLeaveText
        };
      default:
        return {};
    }
  };

  const handleDayClick = (day: number) => {
    const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
      .toISOString().split('T')[0];
    const shift = getShiftForDate(day);
    
    if (shift?.leaveType) {
      setSelectedDate(date);
      setShowDeleteModal(true);
    } else if (!shift) {
      setSelectedDate(date);
      setShowLeaveModal(true);
    }
  };

  const handleAddLeave = (leaveType: LeaveType) => {
    if (selectedDate) {
      onAddLeave(selectedDate, leaveType);
      setShowLeaveModal(false);
      setSelectedDate(null);
    }
  };

  const getTeamNameForDate = (date: string) => {
    const rosterEntry = roster.find(r => r.date === date && r.teamId);
    if (rosterEntry?.teamId) {
      const team = teams.find(t => t.id === rosterEntry.teamId);
      return team?.name || '';
    }
    return '';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="calendar-month" size={20} color={COLORS.primary} />
        <Text style={styles.title}>Personal Roster - {member.name}</Text>
      </View>

      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDays}>
        {weekDays.map((day, index) => (
          <View key={day} style={styles.weekDay}>
            <Text style={[
              styles.weekDayText,
              index === 0 && styles.weekDaySunday
            ]}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.calendarBody}>
        <View style={styles.daysGrid}>
          {Array(firstDayOfMonth).fill(null).map((_, index) => (
            <View key={`empty-${index}`} style={styles.emptyDay} />
          ))}
          {days.map(day => {
            const shift = getShiftForDate(day);
            const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
              .toISOString().split('T')[0];
            const teamName = getTeamNameForDate(date);
            const dayIsWeekend = isWeekend(day);
            const dayIsSunday = new Date(
              selectedMonth.getFullYear(),
              selectedMonth.getMonth(),
              day
            ).getDay() === 0;
            const dayIsPast = isPastDay(day);
            const dayIsToday = isToday(day);
            const leaveStyle = getLeaveStyle(shift?.leaveType);

            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.day,
                  dayIsSunday && calendarStyles.sundayDay,
                  dayIsWeekend && calendarStyles.weekendDay,
                  dayIsPast && calendarStyles.pastDay,
                  shift?.leaveType && { backgroundColor: leaveStyle.background },
                  shift?.shiftId && { backgroundColor: getShiftColor(shift.shiftId) }
                ]}
                onPress={() => !dayIsPast && handleDayClick(day)}
                disabled={dayIsPast}
              >
                <Text style={[
                  styles.dayNumber,
                  dayIsSunday && calendarStyles.sundayText,
                  dayIsWeekend && calendarStyles.weekendDayText,
                  dayIsPast && calendarStyles.pastDayText,
                  shift?.leaveType && { color: leaveStyle.text }
                ]}>
                  {day}
                </Text>
                {dayIsToday && <View style={calendarStyles.todayMarker} />}
                {dayIsPast && (
                  <MaterialCommunityIcons
                    name="close"
                    size={16}
                    color={COLORS.textLight}
                    style={styles.pastDayX}
                  />
                )}
                {shift && (
                  <View style={styles.shiftContainer}>
                    {shift.leaveType ? (
                      <Text style={[
                        styles.shiftText,
                        { color: leaveStyle.text }
                      ]}>
                        {shift.leaveType}
                      </Text>
                    ) : shift.shiftId && (
                      <>
                        <Text style={styles.shiftText}>
                          {shifts.find(s => s.id === shift.shiftId)?.type}
                        </Text>
                        {teamName && (
                          <Text style={styles.teamText}>
                            {teamName}
                          </Text>
                        )}
                      </>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Modal
        visible={showLeaveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLeaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Leave</Text>
              <TouchableOpacity 
                onPress={() => setShowLeaveModal(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TouchableOpacity
                style={styles.leaveButton}
                onPress={() => handleAddLeave('Annual Leave')}
              >
                <MaterialCommunityIcons name="calendar-check" size={24} color={COLORS.primary} />
                <Text style={styles.leaveButtonText}>Annual Leave</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.leaveButton}
                onPress={() => handleAddLeave('Compensation Leave')}
              >
                <MaterialCommunityIcons name="calendar-clock" size={24} color={COLORS.success} />
                <Text style={styles.leaveButtonText}>Compensation Leave</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Remove Leave</Text>
              <TouchableOpacity 
                onPress={() => setShowDeleteModal(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                Are you sure you want to remove this leave?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowDeleteModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={() => {
                    if (selectedDate) {
                      const rosterEntry = roster.find(r => 
                        r.date === selectedDate && 
                        r.leaveType && 
                        r.source === 'Leave'
                      );
                      
                      if (rosterEntry) {
                        onRemoveLeave(rosterEntry.id);
                        setShowDeleteModal(false);
                        setSelectedDate(null);
                      }
                    }
                  }}
                >
                  <Text style={styles.deleteButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    padding: 24,
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'stretch',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  weekDays: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingVertical: 4,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 20,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  weekDaySunday: {
    color: COLORS.sundayText,
  },
  calendarBody: {
    height: 700,
    width: '100%',
    overflow: 'hidden',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 4,
    width: '100%',
  },
  day: {
    width: `${100/7}%`,
    height: 110,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: 'center',
  },
  emptyDay: {
    width: `${100/7}%`,
    height: 110,
  },
  dayNumber: {
    fontSize: 22,
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  shiftContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  shiftText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
  },
  teamText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  pastDayX: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -8 },
      { translateY: -8 }
    ],
  },
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
    maxWidth: 400,
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
    gap: 12,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.divider,
    backgroundColor: COLORS.cardBackground,
  },
  leaveButtonText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: COLORS.background,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  modalText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
}); 