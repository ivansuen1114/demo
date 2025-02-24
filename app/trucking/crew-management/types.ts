export interface CrewMember {
  id: string;
  staffId: string;
  name: string;
  type: 'Senior Crew Leader' | 'Leader' | 'Driver' | 'Guard';
  phone: string;
  email: string;
  joinedDate: string;
  isGunCertified: boolean;
  status: 'Active' | 'On Leave' | 'Inactive';
  avatar?: string;
  skills: string[];
  documents: {
    type: string;
    number: string;
    expiryDate: string;
  }[];
  pdaLogin?: {
    username: string;
    password: string;
  };
}

export type ShiftType = 'Early' | 'Normal' | 'Night';

export interface Shift {
  id: string;
  type: ShiftType;
  startTime: string;
  endTime: string;
  color: string;
  capacity: number;
}

export type LeaveType = 'Annual Leave' | 'Compensation Leave';

export interface RosterEntry {
  id: string;
  date: string;
  crewMemberId: string;
  teamId?: string;
  shiftId?: string;
  leaveType?: LeaveType;
  status: 'Scheduled' | 'Completed' | 'Absent' | 'Leave';
  source: 'Team' | 'Individual' | 'Leave';
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  leader: CrewMember | null;
  driver: CrewMember | null;
  guards: CrewMember[];
  defaultTruckId?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface TeamRoster {
  id: string;
  teamId: string;
  date: string;
  shift: ShiftType;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface TeamRosterGroup {
  id: string;
  dates: string[];
  teamId: string;
  shift: ShiftType;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  createdAt: string;
} 