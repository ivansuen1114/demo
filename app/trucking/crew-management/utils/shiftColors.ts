import { ShiftType } from '../types';
import { COLORS } from '../constants/colors';

export const getShiftColor = (shift: ShiftType) => {
  switch (shift) {
    case 'Early': return COLORS.earlyShift;
    case 'Normal': return COLORS.normalShift;
    case 'Night': return COLORS.nightShift;
    default: return COLORS.borderLight;
  }
};

export const getShiftTextColor = (shift: ShiftType) => {
  switch (shift) {
    case 'Early': return COLORS.primary;
    case 'Normal': return COLORS.success;
    case 'Night': return COLORS.warning;
    default: return COLORS.textSecondary;
  }
}; 