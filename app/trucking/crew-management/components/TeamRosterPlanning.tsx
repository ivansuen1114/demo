import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Team, TeamRoster, ShiftType, RosterEntry, CrewMember } from '../types';
import { calendarStyles } from '../utils/calendarStyles';
import { COLORS } from '../constants/colors';
import { getShiftColor, getShiftTextColor } from '../utils/shiftColors';
import TeamDayEditModal from './TeamDayEditModal';

interface TeamRosterPlanningProps {
  team: Team;
  teamRoster: TeamRoster[];
  memberLeaves: RosterEntry[];
  availableMembers: CrewMember[];
  onAddShifts: (dates: string[], shift: ShiftType) => void;
  onRemoveShift: (rosterId: string) => void;
  onUpdateTeamDay: (date: string, updates: {
    leaderId?: string;
    driverId?: string;
    guardIds?: string[];
  }) => void;
}

interface DayTeamUpdate {
  date: string;
  resolved: boolean;
}

export default function TeamRosterPlanning({
  team,
  teamRoster,
  memberLeaves,
  availableMembers,
  onAddShifts,
  onRemoveShift,
  onUpdateTeamDay,
}: TeamRosterPlanningProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'new' | 'remove'>('new');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [showDayEdit, setShowDayEdit] = useState(false);
  const [selectedEditDate, setSelectedEditDate] = useState<string | null>(null);
  const [resolvedDays, setResolvedDays] = useState<DayTeamUpdate[]>([]);

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
    return teamRoster.find(r => r.date === date);
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + increment);
    setSelectedMonth(newDate);
  };

  const handleDayClick = (day: number) => {
    const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
      .toISOString().split('T')[0];
    const shift = getShiftForDate(day);

    if (!isSelecting) {
      // 开始新的选择
      setIsSelecting(true);
      setStartDate(date);
      setSelectionMode(shift ? 'remove' : 'new');
      setSelectedDates([date]);
    } else {
      // 正在选择中
      if (selectionMode === 'new' && shift) {
        // 不允许在新建模式下选择已有班次的日期
        return;
      }
      if (selectionMode === 'remove' && !shift) {
        // 不允许在删除模式下选择空白日期
        return;
      }

      if (startDate) {
        // 生成日期范围
        const dates = getDatesInRange(startDate, date);
        // 根据模式过滤日期
        const filteredDates = dates.filter(d => {
          const hasShift = teamRoster.some(r => r.date === d);
          return selectionMode === 'remove' ? hasShift : !hasShift;
        });
        setSelectedDates(filteredDates);
      }
    }
  };

  const handleDayLongPress = (day: number) => {
    // 长按重新开始选择
    setIsSelecting(false);
    setStartDate(null);
    setSelectedDates([]);
  };

  const handleAddShifts = (shift: ShiftType) => {
    if (selectedDates.length > 0) {
      onAddShifts(selectedDates, shift);
      setSelectedDates([]);
      setIsSelecting(false);
      setStartDate(null);
    }
  };

  const handleRemoveShifts = () => {
    selectedDates.forEach(date => {
      const rosterEntry = teamRoster.find(r => r.date === date);
      if (rosterEntry) {
        onRemoveShift(rosterEntry.id);
      }
    });
    setSelectedDates([]);
    setIsSelecting(false);
    setStartDate(null);
  };

  const getDatesInRange = (start: string, end: string) => {
    const dates: string[] = [];
    let current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
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

  const hasAssignedShifts = selectedDates.some(date => 
    teamRoster.some(r => r.date === date)
  );

  const getLeaveMembers = (date: string) => {
    return memberLeaves
      .filter(leave => 
        leave.date === date && 
        leave.leaveType && 
        leave.source === 'Leave'
      )
      .map(leave => team.guards.find(g => g.id === leave.crewMemberId) || 
        (team.leader?.id === leave.crewMemberId ? team.leader : null) ||
        (team.driver?.id === leave.crewMemberId ? team.driver : null)
      )
      .filter((member): member is CrewMember => member !== null);
  };

  const handleLeaveWarningClick = (date: string) => {
    setSelectedEditDate(date);
    setShowDayEdit(true);
  };

  const handleTeamUpdate = (date: string, updates: any) => {
    if (selectedEditDate) {
      onUpdateTeamDay(selectedEditDate, updates);
      setResolvedDays(prev => [...prev, { date, resolved: true }]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="calendar-month" size={20} color={COLORS.primary} />
        <Text style={styles.title}>Team Roster Planning - {team.name}</Text>
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
            const isSelected = selectedDates.includes(date);
            const isSelectable = selectionMode === 'new' ? !shift : !!shift;
            const dayIsSunday = new Date(
              selectedMonth.getFullYear(),
              selectedMonth.getMonth(),
              day
            ).getDay() === 0;
            const dayIsWeekend = isWeekend(day);
            const dayIsPast = isPastDay(day);
            const dayIsToday = isToday(day);
            const isResolved = resolvedDays.some(d => d.date === date);
            const leaveMembers = getLeaveMembers(date);
            const hasLeaveMembers = leaveMembers.length > 0;

            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.day,
                  dayIsSunday && calendarStyles.sundayDay,
                  dayIsWeekend && calendarStyles.weekendDay,
                  dayIsPast && calendarStyles.pastDay,
                  shift && { backgroundColor: getShiftColor(shift.shift) },
                  isSelected && styles[selectionMode === 'new' ? 'selectedNew' : 'selectedRemove'],
                  !isSelectable && styles.unselectable,
                  hasLeaveMembers && styles.dayWithLeave,
                ]}
                onPress={() => !isPastDay(day) && handleDayClick(day)}
                onLongPress={() => !isPastDay(day) && handleDayLongPress(day)}
                disabled={isPastDay(day) || (isSelecting && !isSelectable)}
              >
                <Text style={[
                  styles.dayNumber,
                  dayIsSunday && calendarStyles.sundayText,
                  dayIsWeekend && calendarStyles.weekendDayText,
                  dayIsPast && calendarStyles.pastDayText,
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
                  <View style={styles.shiftIndicator}>
                    <Text style={[
                      styles.shiftText,
                      dayIsPast && calendarStyles.pastDayText
                    ]}>
                      {shift.shift}
                    </Text>
                  </View>
                )}
                {hasLeaveMembers && (
                  <View style={styles.leaveIndicator}>
                    {isResolved ? (
                      <MaterialCommunityIcons 
                        name="check-circle" 
                        size={16} 
                        color={COLORS.success} 
                      />
                    ) : (
                      <MaterialCommunityIcons 
                        name="alert-circle" 
                        size={16} 
                        color={COLORS.warning} 
                      />
                    )}
                  </View>
                )}
                {hasLeaveMembers && !isResolved && (
                  <TouchableOpacity
                    style={styles.leaveWarning}
                    onPress={() => handleLeaveWarningClick(date)}
                  >
                    <Text style={styles.leaveWarningText}>
                      On Leave: {leaveMembers.map(m => m.name).join(', ')}
                    </Text>
                  </TouchableOpacity>
                )}
                {isResolved && (
                  <View style={styles.teamUpdate}>
                    <Text style={styles.teamUpdateText}>
                      Team Updated
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {selectedDates.length > 0 && (
        <View style={styles.actionButtons}>
          {selectionMode === 'new' ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: getShiftColor('Early') }]}
                onPress={() => handleAddShifts('Early')}
              >
                <Text style={styles.actionButtonText}>
                  Assign Early Shift ({selectedDates.length} days)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: getShiftColor('Normal') }]}
                onPress={() => handleAddShifts('Normal')}
              >
                <Text style={styles.actionButtonText}>
                  Assign Normal Shift ({selectedDates.length} days)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: getShiftColor('Night') }]}
                onPress={() => handleAddShifts('Night')}
              >
                <Text style={styles.actionButtonText}>
                  Assign Night Shift ({selectedDates.length} days)
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton]}
              onPress={handleRemoveShifts}
            >
              <Text style={styles.removeButtonText}>
                Remove Shifts ({selectedDates.length} days)
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setSelectedDates([]);
              setIsSelecting(false);
              setStartDate(null);
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <TeamDayEditModal
        visible={showDayEdit}
        onClose={() => {
          setShowDayEdit(false);
          setSelectedEditDate(null);
        }}
        date={selectedEditDate || ''}
        team={team}
        availableMembers={availableMembers.filter(member => {
          return !memberLeaves.some(
            leave => leave.date === selectedEditDate && 
                    leave.crewMemberId === member.id
          );
        })}
        onUpdateTeam={(updates) => {
          if (selectedEditDate) {
            handleTeamUpdate(selectedEditDate, updates);
            setShowDayEdit(false);
            setSelectedEditDate(null);
          }
        }}
      />
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
  shiftIndicator: {
    marginTop: 6,
  },
  shiftText: {
    fontSize: 18,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  selectedNew: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  selectedRemove: {
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  unselectable: {
    backgroundColor: COLORS.unselectable,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    backgroundColor: COLORS.background,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  actionButtonText: {
    fontSize: 17,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#FFF5F5',
    borderColor: COLORS.error,
  },
  removeButtonText: {
    color: COLORS.error,
  },
  cancelButton: {
    backgroundColor: '#FFF5F5',
    borderColor: COLORS.textSecondary,
    borderWidth: 1,
    padding: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 17,
    fontWeight: '500',
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
  dayWithLeave: {
    borderColor: COLORS.warning,
    borderWidth: 1,
  },
  leaveIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 1,
  },
  leaveWarning: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    padding: 4,
  },
  leaveWarningText: {
    color: '#FFF',
    fontSize: 12,
    textAlign: 'center',
  },
  teamUpdate: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(46, 125, 50, 0.9)',
    padding: 4,
  },
  teamUpdateText: {
    color: '#FFF',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
}); 