import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import api from '../src/services/api';

interface RecordingDetail {
  id: number;
  created_at: string;
  title: string | null;
  category: string;
  duration_seconds: number;
  overall_score: number;
  words_per_minute: number;
  speech_rate: number;
  articulation_rate: number;
  ideal_min_ppm: number;
  ideal_max_ppm: number;
  is_within_range: boolean;
  active_speech_time: number;
  silence_ratio: number;
  pause_count: number;
  avg_pause_duration: number;
  pacing_consistency: number;
  local_variation_detected: boolean;
  intelligibility_score: number;
  feedback: string;
  confidence: number;
  volume_min_db: number | null;
  volume_max_db: number | null;
  volume_avg_db: number | null;
  volume_data: number[] | null;
  recommendations: string[] | null;
  patterns_identified: string[] | null;
  notes: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  presentation: 'Apresentação',
  pitch: 'Pitch',
  conversation: 'Conversação',
  other: 'Outros'
};

export default function RecordingDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const recordingId = params.id as string;
  
  const [recording, setRecording] = useState<RecordingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (recordingId) {
      fetchRecordingDetail();
    }
  }, [recordingId]);

  const fetchRecordingDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/recordings/recordings/${recordingId}`);
      setRecording(response.data);
    } catch (error) {
      console.error('Error fetching recording detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricStatus = (value: number, min: number, max: number) => {
    if (value >= min && value <= max) return { icon: '✓', text: 'Ideal', color: '#10b981' };
    if (value < min) return { icon: '⚠️', text: 'Baixo', color: '#f59e0b' };
    return { icon: '⚠️', text: 'Alto', color: '#f59e0b' };
  };

  const renderVolumeChart = () => {
    if (!recording?.volume_data || recording.volume_data.length === 0) {
      return null;
    }

    const chartHeight = 120;
    const chartWidth = Dimensions.get('window').width - 80;
    const maxVolume = Math.max(...recording.volume_data);
    const barWidth = chartWidth / recording.volume_data.length - 2;

    return (
      <View style={styles.chartContainer}>
        <View style={[styles.chartBars, { height: chartHeight }]}>
          {recording.volume_data.map((volume, index) => {
            const barHeight = (volume / maxVolume) * chartHeight;
            return (
              <View
                key={index}
                style={[
                  styles.chartBar,
                  {
                    height: barHeight,
                    width: barWidth,
                    backgroundColor: '#3b82f6'
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

  if (!recording) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Gravação não encontrada</Text>
        </View>
      </View>
    );
  }

  const wpmStatus = getMetricStatus(
    recording.words_per_minute,
    recording.ideal_min_ppm,
    recording.ideal_max_ppm
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>PONTUAÇÃO GERAL</Text>
          <Text style={styles.scoreValue}>{recording.overall_score}</Text>
          <Text style={styles.scoreCategory}>
            {CATEGORY_LABELS[recording.category] || recording.category}
          </Text>
          {recording.title && (
            <Text style={styles.scoreTitle}>{recording.title}</Text>
          )}
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Velocidade</Text>
            <Text style={styles.metricValue}>
              {Math.round(recording.words_per_minute)} PPM
            </Text>
            <Text style={[styles.metricStatus, { color: wpmStatus.color }]}>
              {wpmStatus.icon} {wpmStatus.text}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Clareza</Text>
            <Text style={styles.metricValue}>
              {Math.round(recording.intelligibility_score * 100)}%
            </Text>
            <Text style={[styles.metricStatus, { color: '#10b981' }]}>
              ✓ Ótimo
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Pausas</Text>
            <Text style={styles.metricValue}>{recording.pause_count}</Text>
            <Text style={[styles.metricStatus, { color: '#3b82f6' }]}>
              {recording.avg_pause_duration.toFixed(1)}s méd.
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Consistência</Text>
            <Text style={styles.metricValue}>
              {Math.round(recording.pacing_consistency * 100)}%
            </Text>
            <Text style={[styles.metricStatus, { color: '#10b981' }]}>
              ✓ Bom
            </Text>
          </View>
        </View>

        {/* Volume Chart */}
        {recording.volume_data && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>VOLUME AO LONGO DO TEMPO</Text>
            {renderVolumeChart()}
            <View style={styles.volumeStats}>
              <View style={styles.volumeStat}>
                <Text style={styles.volumeLabel}>Mínimo</Text>
                <Text style={styles.volumeValue}>{recording.volume_min_db?.toFixed(0)} dB</Text>
              </View>
              <View style={styles.volumeStat}>
                <Text style={styles.volumeLabel}>Médio</Text>
                <Text style={styles.volumeValue}>{recording.volume_avg_db?.toFixed(0)} dB</Text>
              </View>
              <View style={styles.volumeStat}>
                <Text style={styles.volumeLabel}>Máximo</Text>
                <Text style={styles.volumeValue}>{recording.volume_max_db?.toFixed(0)} dB</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recommendations */}
        {recording.recommendations && recording.recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.recommendationsTitle}>💡 RECOMENDAÇÕES</Text>
            {recording.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Text style={styles.recommendationBullet}>•</Text>
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Patterns */}
        {recording.patterns_identified && recording.patterns_identified.length > 0 && (
          <View style={styles.patternsCard}>
            <Text style={styles.patternsTitle}>PADRÕES IDENTIFICADOS</Text>
            {recording.patterns_identified.map((pattern, index) => (
              <View key={index} style={styles.patternItem}>
                <Text style={styles.patternBullet}>•</Text>
                <Text style={styles.patternText}>{pattern}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Feedback */}
        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackText}>{recording.feedback}</Text>
          <Text style={styles.confidenceText}>
            Confiança: {Math.round(recording.confidence * 100)}%
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/history')}
        >
          <Text style={styles.actionButtonText}>📜 Ver Histórico</Text>
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
  headerTitle: {
    fontSize: 20,
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
  scoreCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3b82f6',
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  scoreCategory: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  scoreTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#262626',
    padding: 16,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  metricStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#262626',
    padding: 20,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 16,
  },
  chartContainer: {
    width: '100%',
    marginBottom: 16,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 2,
  },
  chartBar: {
    borderRadius: 2,
  },
  volumeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  volumeStat: {
    alignItems: 'center',
  },
  volumeLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  volumeValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  recommendationsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
    padding: 20,
    marginBottom: 20,
  },
  recommendationsTitle: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  recommendationBullet: {
    color: '#f59e0b',
    marginRight: 8,
    fontSize: 16,
  },
  recommendationText: {
    flex: 1,
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 20,
  },
  patternsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#262626',
    padding: 20,
    marginBottom: 20,
  },
  patternsTitle: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 12,
  },
  patternItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  patternBullet: {
    color: '#3b82f6',
    marginRight: 8,
    fontSize: 16,
  },
  patternText: {
    flex: 1,
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 20,
  },
  feedbackCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#10b981',
    padding: 20,
    marginBottom: 20,
  },
  feedbackText: {
    color: '#d1d5db',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  confidenceText: {
    color: '#6b7280',
    fontSize: 12,
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
