import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import api from '../src/services/api';

interface UserStats {
  total_recordings: number;
  total_duration_seconds: number;
  average_score: number;
  member_since: string;
  score_trend: number;
  recordings_this_week: number;
  recordings_this_month: number;
  best_score: number;
  best_score_date: string | null;
  evolution_data: Array<{ date: string; score: number }>;
}

export default function Statistics() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/recordings/statistics');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  };

  const renderChart = () => {
    if (!stats?.evolution_data || stats.evolution_data.length === 0) {
      return null;
    }

    const chartHeight = 120;
    const chartWidth = Dimensions.get('window').width - 80;
    const maxScore = Math.max(...stats.evolution_data.map(d => d.score), 100);
    const barWidth = chartWidth / stats.evolution_data.length - 4;

    return (
      <View style={styles.chartContainer}>
        <View style={[styles.chartBars, { height: chartHeight }]}>
          {stats.evolution_data.map((point, index) => {
            const barHeight = (point.score / maxScore) * chartHeight;
            return (
              <View
                key={index}
                style={[
                  styles.chartBar,
                  {
                    height: barHeight,
                    width: barWidth,
                    backgroundColor: point.score >= 80 ? '#10b981' : point.score >= 60 ? '#3b82f6' : '#f59e0b'
                  }
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Erro ao carregar estatísticas</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Estatísticas</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <Text style={styles.username}>Usuário</Text>
          <Text style={styles.memberSince}>
            Membro desde {formatDate(stats.member_since)}
          </Text>
        </View>

        {/* Overall Average */}
        <View style={styles.averageCard}>
          <Text style={styles.averageLabel}>MÉDIA GERAL</Text>
          <Text style={styles.averageValue}>{Math.round(stats.average_score)}</Text>
          <Text style={[
            styles.trendText,
            { color: stats.score_trend >= 0 ? '#10b981' : '#ef4444' }
          ]}>
            {stats.score_trend >= 0 ? '↑' : '↓'} {Math.abs(stats.score_trend)} pontos este mês
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total_recordings}</Text>
            <Text style={styles.statLabel}>Gravações</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDuration(stats.total_duration_seconds)}</Text>
            <Text style={styles.statLabel}>Tempo total</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.recordings_this_week}</Text>
            <Text style={styles.statLabel}>Esta semana</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.best_score}</Text>
            <Text style={styles.statLabel}>Melhor pontuação</Text>
          </View>
        </View>

        {/* Evolution Chart */}
        <View style={styles.evolutionCard}>
          <Text style={styles.evolutionTitle}>EVOLUÇÃO (30 DIAS)</Text>
          {renderChart()}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/history')}
        >
          <Text style={styles.actionButtonText}>📜 Ver Histórico Completo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => router.push('/')}
        >
          <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
            🎤 Nova Gravação
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 60,
  },
  backButtonText: {
    color: '#3b82f6',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#262626',
    borderWidth: 3,
    borderColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarIcon: {
    fontSize: 40,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 13,
    color: '#6b7280',
  },
  averageCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3b82f6',
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  averageLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 8,
  },
  averageValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#262626',
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  evolutionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#262626',
    padding: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  evolutionTitle: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 16,
  },
  chartContainer: {
    width: '100%',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
  },
  chartBar: {
    borderRadius: 4,
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonSecondary: {
    backgroundColor: '#262626',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#3b82f6',
  },
});
