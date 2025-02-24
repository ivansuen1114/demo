import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';

interface RosterEntry {
  date: string;
  crewMemberId: string;
  shiftId: string;
  status: 'Scheduled' | 'Completed' | 'Absent' | 'Leave';
}

interface Shift {
  id: string;
  type: 'Day' | 'Normal' | 'Night';
  startTime: string;
  endTime: string;
  color: string;
}

interface RosterCalendarProps {
  roster: RosterEntry[];
  shifts: Shift[];
  onDateSelect: (date: string) => void;
  selectedDate?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SHIFTS: Shift[] = [
  {
    id: 'day',
    type: 'Day',
    startTime: '07:00',
    endTime: '15:00',
    color: '#E3F2FD'
  },
  {
    id: 'normal',
    type: 'Normal',
    startTime: '15:00',
    endTime: '23:00',
    color: '#E8F5E9'
  },
  {
    id: 'night',
    type: 'Night',
    startTime: '23:00',
    endTime: '07:00',
    color: '#FFF3E0'
  }
];

export default function RosterCalendar({ 
  roster, 
  shifts = SHIFTS,
  onDateSelect,
  selectedDate 
}: RosterCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  
  const getDaysInMonth = () => {
    const start = currentMonth.startOf('month');
    const end = currentMonth.endOf('month');
    const days = [];
    
    // Add days from previous month to start on Sunday
    const startDay = start.day();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: start.subtract(i + 1, 'day'),
        isCurrentMonth: false
      });
    }
    
    // Add days of current month
    for (let i = 0; i < end.date(); i++) {
      days.push({
        date: start.add(i, 'day'),
        isCurrentMonth: true
      });
    }
    
    // Add days from next month to end on Saturday
    const endDay = end.day();
    for (let i = 1; i < 7 - endDay; i++) {
      days.push({
        date: end.add(i, 'day'),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' 
        ? prev.subtract(1, 'month')
        : prev.add(1, 'month')
    );
  };

  const getShiftForDate = (date: string) => {
    return roster.find(r => r.date === date);
  };

  const getShiftColor = (shiftId: string) => {
    const shift = shifts.find(s => s.id === shiftId);
    return shift?.color || '#F5F5F5';
  };

  return (
    <View style={styles.container}>
      {/* 月份導航 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {currentMonth.format('MMMM YYYY')}
        </Text>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* 星期標題 */}
      <View style={styles.weekdayHeader}>
        {WEEKDAYS.map(day => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* 日曆格子 */}
      <ScrollView style={styles.calendarGrid}>
        <View style={styles.daysContainer}>
          {getDaysInMonth().map(({ date, isCurrentMonth }, index) => {
            const dateStr = date.format('YYYY-MM-DD');
            const isSelected = dateStr === selectedDate;
            const shift = getShiftForDate(dateStr);
            const isToday = date.isSame(dayjs(), 'day');

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  !isCurrentMonth && styles.otherMonthDay,
                  isSelected && styles.selectedDay,
                  isToday && styles.today
                ]}
                onPress={() => onDateSelect(dateStr)}
              >
                <Text style={[
                  styles.dayText,
                  !isCurrentMonth && styles.otherMonthText,
                  isSelected && styles.selectedDayText,
                  isToday && styles.todayText
                ]}>
                  {date.date()}
                </Text>
                {shift && (
                  <View 
                    style={[
                      styles.shiftIndicator,
                      { backgroundColor: getShiftColor(shift.shiftId) }
                    ]}
                  >
                    <Text style={styles.shiftText}>
                      {shifts.find(s => s.id === shift.shiftId)?.type}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* 更份圖例 */}
      <View style={styles.legend}>
        {shifts.map(shift => (
          <View key={shift.id} style={styles.legendItem}>
            <View 
              style={[styles.legendColor, { backgroundColor: shift.color }]} 
            />
            <Text style={styles.legendText}>
              {shift.type} ({shift.startTime}-{shift.endTime})
            </Text>
          </View>
        ))}
      </View>
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
  navButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
  },
  monthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  weekdayHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  weekdayCell: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  calendarGrid: {
    flex: 1,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  otherMonthDay: {
    backgroundColor: '#FAFAFA',
  },
  otherMonthText: {
    color: '#999',
  },
  selectedDay: {
    backgroundColor: '#E3F2FD',
  },
  selectedDayText: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
  today: {
    backgroundColor: '#FFF3E0',
  },
  todayText: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  shiftIndicator: {
    marginTop: 4,
    padding: 2,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
  },
  shiftText: {
    fontSize: 10,
    color: '#666',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
}); 