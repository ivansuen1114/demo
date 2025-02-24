import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal } from 'react-native';
import { Text } from '@/components/Themed';
import MainLayout from '@/components/MainLayout';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CrewList from './components/CrewList';
import TeamList from './components/TeamList';
import CrewDetails from './components/CrewDetails';
import RosterCalendar from './components/RosterCalendar';
import ShiftManager from './components/ShiftManager';
import AddTeamModal from './components/AddTeamModal';
import AddMemberModal from './components/AddMemberModal';
import { CrewMember, Shift, RosterEntry, Team } from './types';

// 示例數據
const SAMPLE_CREW_MEMBERS: CrewMember[] = [
  {
    id: '1',
    staffId: 'CR001',
    name: 'John Doe',
    type: 'Leader',
    phone: '+852 9123 4567',
    email: 'john.doe@example.com',
    joinedDate: '2023-01-15',
    isArmoredCertified: true,
    status: 'Active',
    skills: ['Team Management', 'Route Planning'],
    documents: [
      {
        type: 'License',
        number: 'L123456',
        expiryDate: '2024-12-31'
      }
    ]
  },
  {
    id: '2',
    staffId: 'CR002',
    name: 'Jane Smith',
    type: 'Driver',
    phone: '+852 9876 5432',
    email: 'jane.smith@example.com',
    joinedDate: '2023-02-20',
    isArmoredCertified: false,
    status: 'Active',
    skills: ['Heavy Vehicle', 'City Navigation'],
    documents: [
      {
        type: 'License',
        number: 'L789012',
        expiryDate: '2024-10-15'
      }
    ]
  },
  {
    id: '3',
    staffId: 'CR003',
    name: 'Mike Johnson',
    type: 'Guard',
    phone: '+852 9999 8888',
    email: 'mike.j@example.com',
    joinedDate: '2023-03-10',
    isArmoredCertified: true,
    status: 'On Leave',
    skills: ['Security', 'First Aid'],
    documents: [
      {
        type: 'Security License',
        number: 'S345678',
        expiryDate: '2024-08-20'
      }
    ]
  }
];

// 添加示例排班數據
const SAMPLE_ROSTER: RosterEntry[] = [
  {
    date: '2024-03-01',
    crewMemberId: '1',
    shiftId: 'day',
    status: 'Scheduled'
  },
  {
    date: '2024-03-02',
    crewMemberId: '2',
    shiftId: 'normal',
    status: 'Scheduled'
  },
  {
    date: '2024-03-03',
    crewMemberId: '3',
    shiftId: 'night',
    status: 'Scheduled'
  }
];

// 更新 SAMPLE_SHIFTS 以包含 capacity
const SAMPLE_SHIFTS: Shift[] = [
  {
    id: 'day',
    type: 'Day',
    startTime: '07:00',
    endTime: '15:00',
    color: '#E3F2FD',
    capacity: 2
  },
  {
    id: 'normal',
    type: 'Normal',
    startTime: '15:00',
    endTime: '23:00',
    color: '#E8F5E9',
    capacity: 2
  },
  {
    id: 'night',
    type: 'Night',
    startTime: '23:00',
    endTime: '07:00',
    color: '#FFF3E0',
    capacity: 2
  }
];

// 添加示例团队数据
const SAMPLE_TEAMS: Team[] = [
  {
    id: '1',
    name: 'Team Alpha',
    driver: SAMPLE_CREW_MEMBERS[1],
    leader: SAMPLE_CREW_MEMBERS[0],
    guard: SAMPLE_CREW_MEMBERS[2],
    defaultTruckId: 'TRK-001',
    status: 'Active',
    createdAt: '2024-03-01'
  },
  {
    id: '2',
    name: 'Team Beta',
    driver: null,
    leader: null,
    guard: null,
    status: 'Inactive',
    createdAt: '2024-03-02'
  }
];

export default function CrewManagementScreen() {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [shifts, setShifts] = useState<Shift[]>(SAMPLE_SHIFTS);
  const [showShiftManager, setShowShiftManager] = useState(false);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'crew' | 'team'>('crew');
  const [teams, setTeams] = useState<Team[]>(SAMPLE_TEAMS);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>(SAMPLE_CREW_MEMBERS);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);

  const handleSelectMember = (member: CrewMember) => {
    setSelectedMemberId(member.id);
  };

  const handleShiftUpdate = (updatedShifts: Shift[]) => {
    setShifts(updatedShifts);
  };

  const handleAddTeam = () => {
    setShowAddTeam(true);
  };

  const handleSaveTeam = (teamData: Omit<Team, 'id' | 'createdAt'>) => {
    const newTeam: Team = {
      ...teamData,
      id: `team-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTeams(prev => [...prev, newTeam]);
  };

  const handleAddMember = () => {
    setShowAddMember(true);
  };

  const handleSaveMember = (memberData: Omit<CrewMember, 'id'>) => {
    const newMember: CrewMember = {
      ...memberData,
      id: `member-${Date.now()}`
    };
    setCrewMembers(prev => [...prev, newMember]);
  };

  const handleSelectTeam = (team: Team) => {
    // TODO: Implement team details modal
    console.log('Selected team:', team.id);
  };

  const selectedMember = crewMembers.find(member => member.id === selectedMemberId);

  return (
    <MainLayout
      title="Crew Management"
      breadcrumbs={[
        { label: 'Trucking' },
        { label: 'Crew Management' }
      ]}
      toolbarContent={
        <View style={styles.toolbarContent}>
          <TouchableOpacity 
            style={styles.toolbarButton}
            onPress={handleAddMember}
          >
            <MaterialCommunityIcons name="account-plus" size={20} color="#1976D2" />
            <Text style={styles.toolbarButtonText}>Add Member</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.toolbarButton}
            onPress={() => setShowShiftManager(!showShiftManager)}
          >
            <MaterialCommunityIcons 
              name="clock-edit" 
              size={20} 
              color={showShiftManager ? '#1976D2' : '#666'} 
            />
            <Text style={[
              styles.toolbarButtonText,
              showShiftManager && styles.toolbarButtonTextActive
            ]}>
              Manage Shifts
            </Text>
          </TouchableOpacity>
        </View>
      }
    >
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Left Panel - Tabs and Lists */}
          <View style={styles.leftPanel}>
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'crew' && styles.activeTab]}
                onPress={() => setActiveTab('crew')}
              >
                <MaterialCommunityIcons
                  name="account-group"
                  size={20}
                  color={activeTab === 'crew' ? '#1976D2' : '#666'}
                />
                <Text style={[
                  styles.tabText,
                  activeTab === 'crew' && styles.activeTabText
                ]}>
                  Crew
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'team' && styles.activeTab]}
                onPress={() => setActiveTab('team')}
              >
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={20}
                  color={activeTab === 'team' ? '#1976D2' : '#666'}
                />
                <Text style={[
                  styles.tabText,
                  activeTab === 'team' && styles.activeTabText
                ]}>
                  Team
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'crew' ? (
              <CrewList
                crewMembers={crewMembers}
                selectedMemberId={selectedMemberId}
                onSelectMember={handleSelectMember}
                onShowDetails={(member) => {
                  setSelectedMemberId(member.id);
                  setShowMemberDetails(true);
                }}
              />
            ) : (
              <TeamList
                teams={teams}
                onAddTeam={handleAddTeam}
                onSelectTeam={handleSelectTeam}
              />
            )}
          </View>

          {/* Right Panel - Calendar or Shift Management */}
          <View style={[styles.rightPanel, { flex: 1 }]}>
            {showShiftManager ? (
              <ShiftManager
                shifts={shifts}
                onShiftUpdate={handleShiftUpdate}
              />
            ) : (
              <>
                <View style={styles.panelHeader}>
                  <MaterialCommunityIcons name="calendar-month" size={20} color="#1976D2" />
                  <Text style={styles.panelTitle}>Roster Calendar</Text>
                </View>
                <RosterCalendar
                  roster={SAMPLE_ROSTER}
                  shifts={shifts}
                  onDateSelect={(date) => setSelectedDate(date)}
                  selectedDate={selectedDate || undefined}
                />
              </>
            )}
          </View>

          {/* Member Details Modal */}
          <Modal
            visible={showMemberDetails}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowMemberDetails(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Member Details</Text>
                  <TouchableOpacity 
                    onPress={() => setShowMemberDetails(false)}
                    style={styles.closeButton}
                  >
                    <MaterialCommunityIcons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <CrewDetails 
                  member={selectedMember || null} 
                  onEdit={() => {
                    console.log('Edit member:', selectedMember?.id);
                  }}
                />
              </View>
            </View>
          </Modal>

          {/* Add Member Modal */}
          <AddMemberModal
            visible={showAddMember}
            onClose={() => setShowAddMember(false)}
            onSave={handleSaveMember}
          />

          {/* Add Team Modal */}
          <AddTeamModal
            visible={showAddTeam}
            onClose={() => setShowAddTeam(false)}
            onSave={handleSaveTeam}
            availableMembers={crewMembers}
          />
        </View>
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 15,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    gap: 15,
  },
  leftPanel: {
    width: '25%',
  },
  rightPanel: {
    width: '35%',
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  toolbarButtonText: {
    fontSize: 14,
    color: '#666',
  },
  toolbarButtonTextActive: {
    color: '#1976D2',
    fontWeight: '500',
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
    width: '80%',
    maxWidth: 800,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
  },
  activeTab: {
    backgroundColor: '#FFF',
    borderBottomWidth: 2,
    borderBottomColor: '#1976D2',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1976D2',
  },
}); 