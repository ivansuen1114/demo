import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, Alert } from 'react-native';
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
import PDALoginModal from './components/PDALoginModal';
import AddMethodModal from './components/AddMethodModal';
import { CrewMember, Shift, RosterEntry, Team, TeamRoster, ShiftType, LeaveType } from './types';
import * as FileSystem from 'expo-file-system';
import PersonalRosterCalendar from './components/PersonalRosterCalendar';
import TeamRosterPlanning from './components/TeamRosterPlanning';

// 示例數據
const SAMPLE_CREW_MEMBERS: CrewMember[] = [
  {
    id: '1',
    staffId: 'CR001',
    name: 'John Doe',
    type: 'Senior Crew Leader',
    phone: '+852 9123 4567',
    email: 'john.doe@example.com',
    joinedDate: '2023-01-15',
    isGunCertified: true,
    status: 'Active',
    skills: ['Team Management', 'Route Planning'],
    documents: [
      {
        type: 'License',
        number: 'L123456',
        expiryDate: '2024-12-31'
      }
    ],
    pdaLogin: {
      username: 'john.doe',
      password: 'password123'
    }
  },
  {
    id: '2',
    staffId: 'CR002',
    name: 'Jane Smith',
    type: 'Driver',
    phone: '+852 9876 5432',
    email: 'jane.smith@example.com',
    joinedDate: '2023-02-20',
    isGunCertified: false,
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
    isGunCertified: true,
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

// 更新示例排班数据
const SAMPLE_ROSTER: RosterEntry[] = [
  {
    id: 're-1',
    date: '2024-03-01',
    crewMemberId: '1',
    shiftId: 'early',
    status: 'Scheduled',
    source: 'Individual',
    createdAt: '2024-03-01T00:00:00Z'
  },
  {
    id: 're-2',
    date: '2024-03-02',
    crewMemberId: '2',
    shiftId: 'normal',
    status: 'Scheduled',
    source: 'Individual',
    createdAt: '2024-03-01T00:00:00Z'
  },
  {
    id: 're-3',
    date: '2024-03-03',
    crewMemberId: '3',
    shiftId: 'night',
    status: 'Scheduled',
    source: 'Individual',
    createdAt: '2024-03-01T00:00:00Z'
  }
];

// 确保 SAMPLE_SHIFTS 的 id 匹配
const SAMPLE_SHIFTS: Shift[] = [
  {
    id: 'early',
    type: 'Early',
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
    guards: [SAMPLE_CREW_MEMBERS[2]],
    defaultTruckId: 'TRK-001',
    status: 'Active',
    createdAt: '2024-03-01'
  },
  {
    id: '2',
    name: 'Team Beta',
    driver: null,
    leader: null,
    guards: [],
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
  const [editingMember, setEditingMember] = useState<CrewMember | null>(null);
  const [showPDALogin, setShowPDALogin] = useState(false);
  const [editingPDALogin, setEditingPDALogin] = useState<CrewMember | null>(null);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [teamRoster, setTeamRoster] = useState<TeamRoster[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<RosterEntry[]>(SAMPLE_ROSTER.map(r => ({
    ...r,
    id: `re-${Date.now()}-${Math.random()}`,
    source: 'Individual',
    createdAt: new Date().toISOString()
  })));
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

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
    setShowAddMethod(true);
  };

  const handleEditMember = (member: CrewMember) => {
    setEditingMember(member);
    setShowAddMember(true);
    setShowMemberDetails(false);
  };

  const handleSaveMember = (memberData: Omit<CrewMember, 'id'>) => {
    if (editingMember) {
      setCrewMembers(prev => prev.map(member => 
        member.id === editingMember.id 
          ? { ...memberData, id: editingMember.id }
          : member
      ));
      setEditingMember(null);
    } else {
      const newMember: CrewMember = {
        ...memberData,
        id: `member-${Date.now()}`
      };
      setCrewMembers(prev => [...prev, newMember]);
    }
    setShowAddMember(false);
  };

  const handleSelectTeam = (team: Team) => {
    setSelectedTeamId(team.id);
    setSelectedTeam(team);
  };

  const handlePDALoginSave = (pdaLoginData: { username: string; password: string }) => {
    if (editingPDALogin) {
      setCrewMembers(prev => prev.map(member => 
        member.id === editingPDALogin.id 
          ? { ...member, pdaLogin: pdaLoginData }
          : member
      ));
    }
    setShowPDALogin(false);
    setEditingPDALogin(null);
  };

  const handleBulkCreate = async (fileContent: string) => {
    try {
      // 跳过注释行（以 # 开头的行）
      const rows = fileContent.split('\n')
        .filter(row => row.trim() && !row.startsWith('#'));
      const headers = rows[0].split(',');
      
      const newMembers = rows.slice(1).map(row => {
        // 使用正则表达式分割，保留引号内的逗号
        const values = row.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
        // 清理引号
        const cleanValues = values.map(v => v.replace(/^"|"$/g, ''));

        // 处理多个文档
        const docTypes = cleanValues[8].split(',').map(s => s.trim());
        const docNumbers = cleanValues[9].split(',').map(s => s.trim());
        const docExpiries = cleanValues[10].split(',').map(s => s.trim());

        // 创建文档数组
        const documents = docTypes.map((type, index) => ({
          type,
          number: docNumbers[index],
          expiryDate: docExpiries[index]
        }));

        return {
          id: `member-${Date.now()}-${Math.random()}`,
          staffId: cleanValues[0],
          name: cleanValues[1],
          type: cleanValues[2] as CrewMember['type'],
          phone: cleanValues[3],
          email: cleanValues[4],
          joinedDate: cleanValues[5],
          isGunCertified: cleanValues[6].toUpperCase() === 'YES',
          skills: cleanValues[7].split(',').map(s => s.trim()),
          status: 'Active',
          documents,
          pdaLogin: {
            username: cleanValues[11],
            password: cleanValues[12]
          }
        } as CrewMember;
      });

      setCrewMembers(prev => [...prev, ...newMembers]);
      setShowAddMethod(false);
      Alert.alert('Success', `Successfully imported ${newMembers.length} crew members`);
    } catch (error) {
      console.error('Error processing file content:', error);
      Alert.alert(
        'Error', 
        'Failed to process file content. Please check if the file follows the template format.'
      );
    }
  };

  const handleUpdateTeam = (updatedTeam: Team) => {
    setTeams(prev => prev.map(team => 
      team.id === updatedTeam.id ? updatedTeam : team
    ));
  };

  const handleDeleteTeam = (teamId: string) => {
    setTeams(prev => prev.filter(team => team.id !== teamId));
  };

  const selectedMember = crewMembers.find(member => member.id === selectedMemberId);

  const handleAddTeamShifts = (teamId: string, dates: string[], shift: ShiftType) => {
    // 1. 创建团队排班
    const newTeamRosters = dates.map(date => ({
      id: `tr-${Date.now()}-${Math.random()}`,
      teamId,
      date,
      shift,
      status: 'Scheduled',
      createdAt: new Date().toISOString()
    }));

    setTeamRoster(prev => [...prev, ...newTeamRosters]);

    // 2. 为团队成员创建个人排班
    const team = teams.find(t => t.id === teamId);
    if (team) {
      const members = [
        team.leader,
        team.driver,
        ...team.guards
      ].filter((member): member is CrewMember => member !== null);

      const newPersonalRosters = dates.flatMap(date => 
        members.map(member => ({
          id: `r-${Date.now()}-${Math.random()}`,
          date,
          crewMemberId: member.id,
          teamId,
          shiftId: shift.toLowerCase(),
          status: 'Scheduled',
          source: 'Team',
          createdAt: new Date().toISOString()
        }))
      );

      setRoster(prev => [...prev, ...newPersonalRosters]);
    }
  };

  const handleRemoveTeamShift = (rosterId: string) => {
    // 1. 删除团队排班
    setTeamRoster(prev => prev.filter(tr => tr.id !== rosterId));

    // 2. 删除相关的个人排班
    const teamRosterEntry = teamRoster.find(tr => tr.id === rosterId);
    if (teamRosterEntry) {
      setRoster(prev => prev.filter(r => 
        !(r.teamId === teamRosterEntry.teamId && r.date === teamRosterEntry.date)
      ));
    }
  };

  const handleAddLeave = (crewMemberId: string, date: string, leaveType: LeaveType) => {
    const newLeave: RosterEntry = {
      id: `leave-${Date.now()}-${Math.random()}`,
      date,
      crewMemberId,
      leaveType,
      status: 'Leave',
      source: 'Leave',
      createdAt: new Date().toISOString()
    };

    setRoster(prev => [...prev, newLeave]);
  };

  const handleRemoveLeave = (rosterId: string) => {
    setRoster(prev => prev.filter(r => r.id !== rosterId));
  };

  const handleUpdateTeamDay = (
    teamId: string,
    date: string,
    updates: {
      leaderId?: string;
      driverId?: string;
      guardIds?: string[];
    }
  ) => {
    setTeams(prev => prev.map(team => {
      if (team.id !== teamId) return team;

      const updatedTeam = { ...team };
      if (updates.leaderId) {
        updatedTeam.leader = crewMembers.find(m => m.id === updates.leaderId) || null;
      }
      if (updates.driverId) {
        updatedTeam.driver = crewMembers.find(m => m.id === updates.driverId) || null;
      }
      if (updates.guardIds) {
        updatedTeam.guards = updates.guardIds
          .map(id => crewMembers.find(m => m.id === id))
          .filter((member): member is CrewMember => member !== null);
      }
      return updatedTeam;
    }));
  };

  const renderRightPanel = () => {
    if (activeTab === 'crew' && selectedMember) {
      return (
        <PersonalRosterCalendar
          member={selectedMember}
          roster={roster.filter(r => r.crewMemberId === selectedMember.id)}
          shifts={shifts}
          teams={teams}
          onAddLeave={(date, leaveType) => handleAddLeave(selectedMember.id, date, leaveType)}
          onRemoveLeave={handleRemoveLeave}
        />
      );
    }

    if (activeTab === 'team' && selectedTeam) {
      // 获取团队所有成员的 ID
      const teamMemberIds = [
        selectedTeam.leader?.id,
        selectedTeam.driver?.id,
        ...selectedTeam.guards.map(g => g.id)
      ].filter((id): id is string => id !== undefined);

      // 获取这些成员的请假记录
      const teamMemberLeaves = roster.filter(r => 
        teamMemberIds.includes(r.crewMemberId) && 
        r.leaveType && 
        r.source === 'Leave'
      );

      return (
        <TeamRosterPlanning
          team={selectedTeam}
          teamRoster={teamRoster.filter(tr => tr.teamId === selectedTeam.id)}
          memberLeaves={teamMemberLeaves}
          availableMembers={crewMembers}
          onAddShifts={(dates, shift) => handleAddTeamShifts(selectedTeam.id, dates, shift)}
          onRemoveShift={handleRemoveTeamShift}
          onUpdateTeamDay={(date, updates) => handleUpdateTeamDay(selectedTeam.id, date, updates)}
        />
      );
    }

    return null;
  };

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
            <Text style={styles.toolbarButtonText}>Add Crew</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.toolbarButton}
            onPress={handleAddTeam}
          >
            <MaterialCommunityIcons name="account-multiple-plus" size={20} color="#1976D2" />
            <Text style={styles.toolbarButtonText}>Add Team</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.toolbarButton}
            onPress={() => setShowShiftManager(false)}
          >
            <MaterialCommunityIcons 
              name="calendar-month" 
              size={20} 
              color={!showShiftManager ? '#1976D2' : '#666'} 
            />
            <Text style={[
              styles.toolbarButtonText,
              !showShiftManager && styles.toolbarButtonTextActive
            ]}>
              Roster Calendar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.toolbarButton}
            onPress={() => setShowShiftManager(true)}
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
                onShowPDALogin={(member) => {
                  setEditingPDALogin(member);
                  setShowPDALogin(true);
                }}
              />
            ) : (
              <TeamList
                teams={teams}
                selectedTeamId={selectedTeamId}
                onSelectTeam={handleSelectTeam}
                onUpdateTeam={handleUpdateTeam}
                onDeleteTeam={handleDeleteTeam}
                availableMembers={crewMembers}
                teamRoster={teamRoster}
              />
            )}
          </View>

          {/* Right Panel - Calendar or Shift Management */}
          <View style={[styles.rightPanel, { flex: 1 }]}>
            {renderRightPanel()}
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
                  member={selectedMember} 
                  onEdit={() => {
                    if (selectedMember) {
                      handleEditMember(selectedMember);
                    }
                  }}
                />
              </View>
            </View>
          </Modal>

          {/* Add/Edit Member Modal */}
          <AddMemberModal
            visible={showAddMember}
            onClose={() => {
              setShowAddMember(false);
              setEditingMember(null);
            }}
            onSave={handleSaveMember}
            initialData={editingMember}
          />

          {/* Add Team Modal */}
          <AddTeamModal
            visible={showAddTeam}
            onClose={() => setShowAddTeam(false)}
            onSave={handleSaveTeam}
            availableMembers={crewMembers}
          />

          {/* PDALogin Modal */}
          <PDALoginModal
            visible={showPDALogin}
            onClose={() => {
              setShowPDALogin(false);
              setEditingPDALogin(null);
            }}
            onSave={handlePDALoginSave}
            initialData={editingPDALogin?.pdaLogin}
          />

          <AddMethodModal
            visible={showAddMethod}
            onClose={() => setShowAddMethod(false)}
            onSelectManual={() => {
              setShowAddMethod(false);
              setShowAddMember(true);
            }}
            onBulkCreate={handleBulkCreate}
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