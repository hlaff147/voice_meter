import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import api from '../src/services/api';

interface MispronouncedWord {
  expected: string;
  heard: string;
  similarity: number;
}

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
  // Text comparison fields
  expected_text: string | null;
  transcribed_text: string | null;
  pronunciation_score: number | null;
  similarity_ratio: number | null;
  word_accuracy: number | null;
  expected_word_count: number | null;
  transcribed_word_count: number | null;
  missing_words: string[] | null;
  extra_words: string[] | null;
  mispronounced_words: MispronouncedWord[] | null;
}

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
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

  // Determine main score (pronunciation if available, otherwise overall)
  const mainScore = recording.pronunciation_score ?? recording.overall_score;

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
        <View style={[styles.scoreCard, { borderColor: getScoreColor(mainScore) }]}>
          <Text style={styles.scoreLabel}>
            {recording.pronunciation_score !== null ? 'PONTUAÇÃO DE PRONÚNCIA' : 'PONTUAÇÃO GERAL'}
          </Text>
          <Text style={[styles.scoreValue, { color: getScoreColor(mainScore) }]}>{mainScore}</Text>
          {recording.similarity_ratio !== null && (
            <Text style={styles.scoreSubtext}>
              {(recording.similarity_ratio * 100).toFixed(1)}% de similaridade
            </Text>
          )}
          <Text style={styles.scoreCategory}>Apresentação</Text>
        </View>

        {/* Text Comparison Section - NEW */}
        {recording.expected_text && (
          <View style={styles.comparisonCard}>
            <Text style={styles.comparisonTitle}>📝 Comparação de Textos</Text>
            
            <View style={styles.textBox}>
              <Text style={styles.textBoxLabel}>Texto Esperado:</Text>
              <Text style={styles.textBoxContent}>{recording.expected_text}</Text>
            </View>

            <View style={[styles.textBox, styles.textBoxTranscribed]}>
              <Text style={styles.textBoxLabel}>O que você disse:</Text>
              <Text style={styles.textBoxContent}>
                {recording.transcribed_text || 'Não foi possível transcrever'}
              </Text>
            </View>

            {/* Word counts */}
            <View style={styles.wordCountRow}>
              <Text style={styles.wordCountText}>
                Palavras: {recording.transcribed_word_count ?? '—'} / {recording.expected_word_count ?? '—'}
              </Text>
              {recording.word_accuracy !== null && (
                <Text style={styles.wordCountText}>
                  Precisão: {(recording.word_accuracy * 100).toFixed(0)}%
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Issues Found - NEW */}
        {((recording.missing_words && recording.missing_words.length > 0) || 
          (recording.mispronounced_words && recording.mispronounced_words.length > 0)) && (
          <View style={styles.issuesCard}>
            <Text style={styles.issuesTitle}>⚠️ Pontos de Atenção</Text>
            
            {recording.missing_words && recording.missing_words.length > 0 && (
              <View style={styles.issueSection}>
                <Text style={styles.issueLabel}>Palavras não detectadas:</Text>
                <Text style={styles.issueWords}>
                  {recording.missing_words.slice(0, 8).join(', ')}
                  {recording.missing_words.length > 8 && ` (+${recording.missing_words.length - 8})`}
                </Text>
              </View>
            )}

            {recording.mispronounced_words && recording.mispronounced_words.length > 0 && (
              <View style={styles.issueSection}>
                <Text style={styles.issueLabel}>Pronúncia diferente:</Text>
                {recording.mispronounced_words.slice(0, 5).map((mp, idx) => (
                  <Text key={idx} style={styles.issueWords}>
                    "{mp.expected}" → "{mp.heard}" ({(mp.similarity * 100).toFixed(0)}%)
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

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
              {Math.round(recording.intelligibility_score)}%
            </Text>
            <Text style={[styles.metricStatus, { color: recording.intelligibility_score >= 80 ? '#10b981' : '#f59e0b' }]}>
              {recording.intelligibility_score >= 80 ? '✓ Ótimo' : '⚠️ Melhorar'}
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
            <Text style={styles.metricLabel}>Duração</Text>
            <Text style={styles.metricValue}>
              {recording.duration_seconds.toFixed(1)}s
            </Text>
            <Text style={styles.metricStatus}>
              {recording.active_speech_time.toFixed(1)}s fala
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
    borderWidth: 3,
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
    marginBottom: 4,
  },
  scoreSubtext: {
    fontSize: 14,
    color: '#9ca3af',
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
  // Text Comparison styles
  comparisonCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#262626',
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  textBox: {
    backgroundColor: '#262626',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  textBoxTranscribed: {
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginBottom: 12,
  },
  textBoxLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 6,
  },
  textBoxContent: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  wordCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wordCountText: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Issues styles
  issuesCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  issuesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f59e0b',
    marginBottom: 12,
  },
  issueSection: {
    marginBottom: 12,
  },
  issueLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  issueWords: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 2,
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
