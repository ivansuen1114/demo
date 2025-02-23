import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';

export type DateType = Date | undefined;

interface DateTimePickerProps {
  mode?: 'single' | 'range';
  date?: DateType;
  onChange: (params: { date: DateType }) => void;
  locale?: string;
  style?: any;
  classNames?: {
    day?: string;
    selected?: string;
    selected_label?: string;
  };
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  mode = 'single',
  date,
  onChange,
  locale = 'zh',
  style,
  classNames,
}) => {
  const currentDate = date || new Date();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleDateChange = (newDate: Date) => {
    onChange({ date: newDate });
  };

  const handleTimeChange = (hour: number, minute: number) => {
    const newDate = new Date(currentDate);
    newDate.setHours(hour);
    newDate.setMinutes(minute);
    onChange({ date: newDate });
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.timePickerContainer}>
        {/* 小時選擇 */}
        <View style={styles.timeColumn}>
          <Text style={styles.timeLabel}>小時</Text>
          <View style={styles.timeList}>
            {hours.map((hour) => (
              <TouchableOpacity
                key={hour}
                style={[
                  styles.timeItem,
                  currentDate.getHours() === hour && styles.selectedTimeItem
                ]}
                onPress={() => handleTimeChange(hour, currentDate.getMinutes())}
              >
                <Text style={[
                  styles.timeText,
                  currentDate.getHours() === hour && styles.selectedTimeText
                ]}>
                  {hour.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 分鐘選擇 */}
        <View style={styles.timeColumn}>
          <Text style={styles.timeLabel}>分鐘</Text>
          <View style={styles.timeList}>
            {minutes.map((minute) => (
              <TouchableOpacity
                key={minute}
                style={[
                  styles.timeItem,
                  currentDate.getMinutes() === minute && styles.selectedTimeItem
                ]}
                onPress={() => handleTimeChange(currentDate.getHours(), minute)}
              >
                <Text style={[
                  styles.timeText,
                  currentDate.getMinutes() === minute && styles.selectedTimeText
                ]}>
                  {minute.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.selectedTime}>
          已選擇時間：{dayjs(currentDate).format('YYYY-MM-DD HH:mm')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    maxWidth: 400,
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  timeList: {
    height: 200,
    overflow: 'scroll',
  },
  timeItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 2,
    borderRadius: 4,
  },
  selectedTimeItem: {
    backgroundColor: '#E3F2FD',
  },
  timeText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedTimeText: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  selectedTime: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});

export default DateTimePicker; 