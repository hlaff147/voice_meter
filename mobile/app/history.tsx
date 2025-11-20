import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { apiService } from '../src/services/api';

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
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDesktop = width > 768;

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await apiService.getHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history', err);
      setError('Não foi possível carregar o histórico.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const renderItem = ({ item }: { item: any }) => {
    const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other;
    
    return (
      <View style={[styles.card, { borderColor: color }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>{CATEGORY_NAMES[item.category] || item.category}</Text>
          </View>
          <Text style={styles.date}>{formatDate(item.created_at)}</Text>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Velocidade (AR)</Text>
            <Text style={[styles.metricValue, { color }]}>{item.articulation_rate.toFixed(1)} PPM</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Inteligibilidade</Text>
            <Text style={[
              styles.metricValue, 
              { color: item.intelligibility_score > 80 ? '#10b981' : item.intelligibility_score > 60 ? '#f59e0b' : '#ef4444' }
            ]}>
              {item.intelligibility_score.toFixed(0)}%
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Pausas</Text>
            <Text style={styles.metricValue}>{item.pause_count}</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Duração</Text>
            <Text style={styles.metricValue}>{item.duration_seconds.toFixed(1)}s</Text>
          </View>
        </View>
      </View>
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
            data={history}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhuma gravação encontrada.</Text>
              </View>
            }
            numColumns={isDesktop ? 2 : 1}
            key={isDesktop ? 'desktop' : 'mobile'} // Force re-render on layout change
            columnWrapperStyle={isDesktop ? styles.columnWrapper : undefined}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    marginBottom: 16,
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    color: '#9ca3af',
    fontSize: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#262626',
    padding: 10,
    borderRadius: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
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
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
});
