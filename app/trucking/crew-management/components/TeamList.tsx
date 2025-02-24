import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Team, TeamRoster } from '../types';
import AddTeamModal from './AddTeamModal'; // 用于编辑

interface TeamListProps {
  teams: Team[];
  selectedTeamId: string | null;
  onSelectTeam: (team: Team) => void;
  onUpdateTeam: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
  availableMembers: CrewMember[];
  teamRoster: TeamRoster[];
}

export default function TeamList({ 
  teams, 
  selectedTeamId,
  onSelectTeam,
  onUpdateTeam,
  onDeleteTeam,
  availableMembers,
  teamRoster
}: TeamListProps) {
  const [searchText, setSearchText] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setShowEditModal(true);
  };

  const handleSaveEdit = (teamData: Omit<Team, 'id' | 'createdAt'>) => {
    if (editingTeam) {
      onUpdateTeam({
        ...teamData,
        id: editingTeam.id,
        createdAt: editingTeam.createdAt
      });
    }
    setShowEditModal(false);
    setEditingTeam(null);
  };

  const getCurrentShift = (team: Team, teamRoster: TeamRoster[]) => {
    const today = new Date().toISOString().split('T')[0];
    const currentRoster = teamRoster.find(
      r => r.teamId === team.id && r.date === today
    );
    return currentRoster?.shift;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons name="account-group" size={20} color="#1976D2" />
          <Text style={styles.title}>Teams</Text>
        </View>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search teams..."
              placeholderTextColor="#999"
            />
            {searchText ? (
              <TouchableOpacity
                onPress={() => setSearchText('')}
                style={styles.clearButton}
              >
                <MaterialCommunityIcons name="close-circle" size={16} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView style={styles.teamList}>
        {filteredTeams.map((team) => {
          const currentShift = getCurrentShift(team, teamRoster);
          const isSelected = team.id === selectedTeamId;
          
          return (
            <TouchableOpacity
              key={team.id}
              style={[
                styles.teamCard,
                isSelected && styles.selectedTeamCard
              ]}
              onPress={() => onSelectTeam(team)}
            >
              {currentShift && (
                <View style={styles.shiftLabel}>
                  <Text style={styles.shiftText}>{currentShift}</Text>
                </View>
              )}
              <View style={styles.teamContent}>
                <Text style={styles.teamName}>{team.name}</Text>
                
                {team.defaultTruckId && (
                  <View style={styles.truckInfo}>
                    <MaterialCommunityIcons name="truck" size={16} color="#666" />
                    <Text style={styles.infoText}>
                      Truck: {team.defaultTruckId}
                    </Text>
                  </View>
                )}

                <View style={styles.membersContainer}>
                  <View style={styles.memberRow}>
                    <MaterialCommunityIcons name="account-star" size={16} color="#666" />
                    <Text style={styles.memberLabel}>Leader:</Text>
                    <Text style={styles.memberText}>
                      {team.leader?.name || '-'}
                    </Text>
                  </View>

                  <View style={styles.memberRow}>
                    <MaterialCommunityIcons name="steering" size={16} color="#666" />
                    <Text style={styles.memberLabel}>Driver:</Text>
                    <Text style={styles.memberText}>
                      {team.driver?.name || '-'}
                    </Text>
                  </View>

                  <View style={styles.memberRow}>
                    <MaterialCommunityIcons name="shield-account" size={16} color="#666" />
                    <Text style={styles.memberLabel}>Guards:</Text>
                    <Text style={styles.memberText}>
                      {team.guards.length > 0 
                        ? team.guards.map(g => g.name).join(', ')
                        : '-'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEdit(team);
                  }}
                >
                  <MaterialCommunityIcons name="pencil" size={16} color="#1976D2" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    onDeleteTeam(team.id);
                  }}
                >
                  <MaterialCommunityIcons name="delete" size={16} color="#D32F2F" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <AddTeamModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTeam(null);
        }}
        onSave={handleSaveEdit}
        availableMembers={availableMembers}
        initialData={editingTeam}
        mode="edit"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  teamList: {
    flex: 1,
    padding: 16,
  },
  teamCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    position: 'relative',
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  teamContent: {
    flex: 1,
    gap: 12,
    paddingBottom: 24,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  truckInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    paddingTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  membersContainer: {
    gap: 8,
    paddingTop: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  memberLabel: {
    fontSize: 14,
    color: '#666',
    width: 60,
  },
  memberText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    paddingHorizontal: 8,
    flex: 1,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 14,
    color: '#333',
    paddingHorizontal: 8,
  },
  clearButton: {
    padding: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
    position: 'absolute',
    right: 8,
    bottom: 8,
  },
  actionButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(211, 47, 47, 0.05)',
  },
  shiftLabel: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#2E7D32',
    padding: 4,
    borderRadius: 4,
  },
  shiftText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  selectedTeamCard: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
    borderWidth: 2,
  },
}); 