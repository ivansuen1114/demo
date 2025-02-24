import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Team } from '../types';

interface TeamListProps {
  teams: Team[];
  onAddTeam: () => void;
  onSelectTeam: (team: Team) => void;
}

export default function TeamList({ teams, onAddTeam, onSelectTeam }: TeamListProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={onAddTeam}>
        <MaterialCommunityIcons name="plus-circle" size={24} color="#1976D2" />
        <Text style={styles.addButtonText}>Add New Team</Text>
      </TouchableOpacity>

      <ScrollView style={styles.teamList}>
        {teams.map((team) => (
          <TouchableOpacity
            key={team.id}
            style={styles.teamCard}
            onPress={() => onSelectTeam(team)}
          >
            <View style={styles.teamHeader}>
              <Text style={styles.teamName}>{team.name}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: team.status === 'Active' ? '#E8F5E9' : '#FFEBEE' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: team.status === 'Active' ? '#2E7D32' : '#C62828' }
                ]}>
                  {team.status}
                </Text>
              </View>
            </View>

            <View style={styles.memberList}>
              <View style={styles.memberItem}>
                <Text style={styles.memberLabel}>Leader:</Text>
                <Text style={styles.memberName}>{team.leader?.name || 'Not Assigned'}</Text>
              </View>
              <View style={styles.memberItem}>
                <Text style={styles.memberLabel}>Driver:</Text>
                <Text style={styles.memberName}>{team.driver?.name || 'Not Assigned'}</Text>
              </View>
              <View style={styles.memberItem}>
                <Text style={styles.memberLabel}>Guard:</Text>
                <Text style={styles.memberName}>{team.guard?.name || 'Not Assigned'}</Text>
              </View>
            </View>

            {team.defaultTruckId && (
              <View style={styles.truckInfo}>
                <MaterialCommunityIcons name="truck" size={16} color="#666" />
                <Text style={styles.truckText}>Default Truck: {team.defaultTruckId}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  addButtonText: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: '500',
  },
  teamList: {
    flex: 1,
    padding: 16,
  },
  teamCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  memberList: {
    gap: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberLabel: {
    width: 80,
    fontSize: 14,
    color: '#666',
  },
  memberName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  truckInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  truckText: {
    fontSize: 14,
    color: '#666',
  },
}); 