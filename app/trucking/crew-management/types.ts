export interface CrewMember {
  id: string;
  staffId: string;
  name: string;
  type: 'Leader' | 'Driver' | 'Guard';
  phone: string;
  email: string;
  joinedDate: string;
  isArmoredCertified: boolean;
  status: 'Active' | 'On Leave' | 'Inactive';
  avatar?: string;
  skills: string[];
  documents: {
    type: string;
    number: string;
    expiryDate: string;
  }[];
}

export interface Shift {
  id: string;
  type: 'Day' | 'Normal' | 'Night';
  startTime: string;
  endTime: string;
  color: string;
  capacity: number;
}

export interface RosterEntry {
  date: string;
  crewMemberId: string;
  shiftId: string;
  status: 'Scheduled' | 'Completed' | 'Absent' | 'Leave';
}

export interface Team {
  id: string;
  name: string;
  driver: CrewMember | null;
  leader: CrewMember | null;
  guard: CrewMember | null;
  defaultTruckId?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
} 