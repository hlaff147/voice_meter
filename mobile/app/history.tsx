import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import api from '../src/services/api';

interface Recording {
  id: number;
  created_at: string;
  title: string | null;
  category: string;
  duration_seconds: number;
  overall_score: number;
  words_per_minute: number;
}

const FILTER_OPTIONS = [
  { id: 'all', label: 'Todos' },
  { id: 'week', label: 'Esta Semana' },
  { id: 'month', label: 'Este Mês' }
];

const CATEGORY_COLORS: Record<string, string> = {
  presentation: '#10b981',
  pitch: '#f59e0b',
  conversation: '#3b82f6',
  other: '#8b5cf6',
};

const CATEGORY_NAMES: Record<string, string> = {
  presentation: 'Apresentação',
  pitch: 'Pitch',
  conversation: 'Conversação',
  other: 'Outros',
};

export default function History() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const isDesktop = width > 768;

  useEffect(() => {
    loadHistory();
  }, [selectedFilter]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/recordings/recordings?period=${selectedFilter}`);
      setRecordings(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load history', err);
      setError('Não foi possível carregar o histórico.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Ontem, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}min ${secs}s`;
  };

  const handleRecordingPress = (recordingId: number) => {
    router.push(`/recording-detail?id=${recordingId}`);
  };

  const renderItem = ({ item }: { item: Recording }) => {
    const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other;
    const scorePercent = Math.min(Math.max(item.overall_score, 0), 100);

    // Determine score color based on value
    const getScoreColor = (score: number) => {
      if (score >= 80) return '#10b981';
      if (score >= 60) return '#f59e0b';
      return '#ef4444';
    };
    const scoreColor = getScoreColor(item.overall_score);

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}
        onPress={() => handleRecordingPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>{CATEGORY_NAMES[item.category] || item.category}</Text>
          </View>
          <Text style={styles.date}>{formatDate(item.created_at)}</Text>
        </View>

        {item.title && (
          <Text style={styles.recordingTitle}>{item.title}</Text>
        )}

        {/* Score Progress Bar */}
        <View style={styles.scoreProgressContainer}>
          <View style={styles.scoreProgressHeader}>
            <Text style={styles.scoreLabel}>Pontuação</Text>
            <Text style={[styles.scoreValueLarge, { color: scoreColor }]}>{item.overall_score}</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${scorePercent}%`, backgroundColor: scoreColor }
              ]}
            />
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricIcon}>⚡</Text>
            <Text style={styles.metricValue}>{Math.round(item.words_per_minute)} PPM</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricIcon}>⏱️</Text>
            <Text style={styles.metricValue}>{formatDuration(item.duration_seconds)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Histórico</Text>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          {FILTER_OPTIONS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                selectedFilter === filter.id && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter.id && styles.filterButtonTextActive
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadHistory}>
              <Text style={styles.retryText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={recordings}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📝</Text>
                <Text style={styles.emptyText}>Nenhuma gravação encontrada</Text>
                <Text style={styles.emptySubtext}>
                  Faça sua primeira gravação para ver o histórico
                </Text>
              </View>
            }
            numColumns={isDesktop ? 2 : 1}
            key={isDesktop ? 'desktop' : 'mobile'}
            columnWrapperStyle={isDesktop ? styles.columnWrapper : undefined}
            ListFooterComponent={
              recordings.length > 0 ? (
                <TouchableOpacity
                  style={styles.statsButton}
                  onPress={() => router.push('/statistics')}
                >
                  <Text style={styles.statsButtonIcon}>📊</Text>
                  <Text style={styles.statsButtonText}>Ver estatísticas completas</Text>
                </TouchableOpacity>
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 1024,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    backgroundColor: '#1c1c1e',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  columnWrapper: {
    gap: 16,
  },
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    marginBottom: 16,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    color: '#a1a1aa',
    fontSize: 12,
  },
  recordingTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  metricIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  scoreProgressContainer: {
    marginBottom: 12,
  },
  scoreProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  scoreValueLarge: {
    fontSize: 20,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#252528',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#71717a',
    fontSize: 14,
    textAlign: 'center',
  },
  statsButton: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    padding: 24,
    marginTop: 12,
    alignItems: 'center',
  },
  statsButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statsButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
});
