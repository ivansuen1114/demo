import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export const calendarStyles = StyleSheet.create({
  weekendDay: {
    backgroundColor: COLORS.weekend,
  },
  weekendDayText: {
    color: COLORS.weekendText,
  },
  pastDay: {
    backgroundColor: COLORS.past,
  },
  pastDayText: {
    color: COLORS.pastText,
    textDecorationLine: 'line-through',
  },
  todayMarker: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  sundayDay: {
    backgroundColor: COLORS.sundayBackground,
  },
  sundayText: {
    color: COLORS.sundayText,
  },
}); 