import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import api from '../src/services/api';

// Função para renderizar gráfico de volume
const renderVolumeChart = (volumeData: number[] | null, screenWidth: number) => {
  if (!volumeData || volumeData.length === 0) {
    return null;
  }

  const chartHeight = 100;
  const chartWidth = screenWidth - 80;
  const maxVolume = Math.max(...volumeData, 1);
  const barWidth = Math.max(2, chartWidth / volumeData.length - 1);

  return (
    <View style={chartStyles.chartContainer}>
      <View style={[chartStyles.chartBars, { height: chartHeight }]}>
        {volumeData.map((volume, index) => {
          const barHeight = Math.max(2, (volume / maxVolume) * chartHeight);
          return (
            <View
              key={index}
              style={[
                chartStyles.chartBar,
                {
                  height: barHeight,
                  width: barWidth,
                  backgroundColor: volume > 70 ? '#10b981' : volume > 40 ? '#3b82f6' : '#6b7280'
                }
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

// Estilos do gráfico
const chartStyles = StyleSheet.create({
  chartContainer: {
    width: '100%',
    marginVertical: 12,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 1,
  },
  chartBar: {
    borderRadius: 2,
  },
});

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
  const { width } = useWindowDimensions();

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
        {/* Git-diff Style Comparison */}
        {recording.expected_text && (
          <View style={styles.diffContainer}>
            <Text style={styles.diffTitle}>📊 Comparação de Textos</Text>
            {recording.similarity_ratio !== null && (
              <Text style={styles.similarityBadge}>
                {(recording.similarity_ratio * 100).toFixed(0)}% similaridade
              </Text>
            )}

            {/* Legenda de Cores */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Correto</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.legendText}>Não detectado</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#eab308' }]} />
                <Text style={styles.legendText}>Diferente</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.legendText}>Extra</Text>
              </View>
            </View>

            <View style={styles.diffGrid}>
              {/* Expected Text Column */}
              <View style={styles.diffColumn}>
                <View style={styles.diffHeaderExpected}>
                  <Text style={styles.diffHeaderText}>📄 ESPERADO</Text>
                </View>
                <View style={styles.diffContent}>
                  <Text style={styles.diffText}>
                    {recording.expected_text?.split(' ').map((word: string, idx: number) => {
                      const normalizedWord = word.toLowerCase().replace(/[.,!?]/g, '');
                      const missingWords = (recording.missing_words || []).map((w: string) => w.toLowerCase());
                      const mispronounced = (recording.mispronounced_words || []).map((m: MispronouncedWord) => m.expected?.toLowerCase());
                      
                      const isMissing = missingWords.includes(normalizedWord);
                      const isMispronounced = mispronounced.includes(normalizedWord);
                      
                      let wordStyle = styles.wordMatch;
                      if (isMissing) wordStyle = styles.wordMissing;
                      else if (isMispronounced) wordStyle = styles.wordMispronounced;
                      
                      return (
                        <Text key={idx} style={wordStyle}>
                          {word}{' '}
                        </Text>
                      );
                    })}
                  </Text>
                </View>
              </View>

              {/* Transcribed Text Column */}
              <View style={styles.diffColumn}>
                <View style={styles.diffHeaderTranscribed}>
                  <Text style={styles.diffHeaderText}>🎤 TRANSCRITO</Text>
                </View>
                <View style={styles.diffContent}>
                  <Text style={styles.diffText}>
                    {recording.transcribed_text ? recording.transcribed_text.split(' ').map((word: string, idx: number) => {
                      const normalizedWord = word.toLowerCase().replace(/[.,!?]/g, '');
                      const extraWords = (recording.extra_words || []).map((w: string) => w.toLowerCase());
                      const mispronounced = (recording.mispronounced_words || []).map((m: MispronouncedWord) => m.heard?.toLowerCase());
                      
                      const isExtra = extraWords.includes(normalizedWord);
                      const isMispronounced = mispronounced.includes(normalizedWord);
                      
                      let wordStyle = styles.wordCorrect;
                      if (isExtra) wordStyle = styles.wordExtra;
                      else if (isMispronounced) wordStyle = styles.wordMispronounced;
                      
                      return (
                        <Text key={idx} style={wordStyle}>
                          {word}{' '}
                        </Text>
                      );
                    }) : <Text style={styles.wordMissing}>Não foi possível transcrever</Text>}
                  </Text>
                </View>
              </View>
            </View>

            {/* Simple Stats */}
            <View style={styles.statsRow}>
              <Text style={styles.statText}>
                {recording.transcribed_word_count ?? 0} / {recording.expected_word_count ?? 0} palavras
              </Text>
              {recording.missing_words && recording.missing_words.length > 0 && (
                <Text style={styles.statMissing}>
                  {recording.missing_words.length} não detectadas
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Volume Chart Card */}
        {recording.volume_data && recording.volume_data.length > 0 && (
          <View style={styles.audioCard}>
            <Text style={styles.audioCardTitle}>🔊 Volume do Áudio</Text>
            {renderVolumeChart(recording.volume_data, width)}
            <View style={styles.volumeStats}>
              <View style={styles.volumeStatItem}>
                <Text style={styles.volumeStatLabel}>Mín</Text>
                <Text style={styles.volumeStatValue}>{recording.volume_min_db?.toFixed(0) ?? 0}%</Text>
              </View>
              <View style={styles.volumeStatItem}>
                <Text style={styles.volumeStatLabel}>Média</Text>
                <Text style={styles.volumeStatValue}>{recording.volume_avg_db?.toFixed(0) ?? 0}%</Text>
              </View>
              <View style={styles.volumeStatItem}>
                <Text style={styles.volumeStatLabel}>Máx</Text>
                <Text style={styles.volumeStatValue}>{recording.volume_max_db?.toFixed(0) ?? 0}%</Text>
              </View>
            </View>
          </View>
        )}

        {/* Metrics Card - Velocidade e Pausas */}
        <View style={styles.metricsCard}>
          <Text style={styles.metricsCardTitle}>📈 Métricas de Fala</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{Math.round(recording.articulation_rate ?? recording.words_per_minute ?? 0)}</Text>
              <Text style={styles.metricLabel}>palavras/min</Text>
              <Text style={styles.metricIdeal}>Ideal: {recording.ideal_min_ppm ?? 140}-{recording.ideal_max_ppm ?? 160}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{recording.pause_count ?? 0}</Text>
              <Text style={styles.metricLabel}>pausas</Text>
              <Text style={styles.metricIdeal}>detectadas</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{recording.duration_seconds?.toFixed(1) ?? 0}s</Text>
              <Text style={styles.metricLabel}>duração</Text>
              <Text style={styles.metricIdeal}>total</Text>
            </View>
          </View>
        </View>

        {/* Métricas Detalhadas de Análise */}
        {recording.expected_text && (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisCardTitle}>🔍 Análise Detalhada</Text>
            
            <View style={styles.analysisGrid}>
              {/* Precisão por Palavra */}
              <View style={styles.analysisItem}>
                <Text style={styles.analysisValue}>
                  {recording.word_accuracy !== null ? (recording.word_accuracy * 100).toFixed(0) : '-'}%
                </Text>
                <Text style={styles.analysisLabel}>Precisão por Palavra</Text>
              </View>
              
              {/* Score de Pronúncia */}
              <View style={styles.analysisItem}>
                <Text style={styles.analysisValue}>
                  {recording.pronunciation_score ?? '-'}
                </Text>
                <Text style={styles.analysisLabel}>Score de Pronúncia</Text>
              </View>
              
              {/* Contagem de Palavras */}
              <View style={styles.analysisItem}>
                <Text style={styles.analysisValue}>
                  {recording.transcribed_word_count ?? 0}/{recording.expected_word_count ?? 0}
                </Text>
                <Text style={styles.analysisLabel}>Palavras (Trans/Esp)</Text>
              </View>
              
              {/* Palavras Não Detectadas */}
              <View style={styles.analysisItem}>
                <Text style={[styles.analysisValue, { color: (recording.missing_words?.length ?? 0) > 0 ? '#ef4444' : '#10b981' }]}>
                  {recording.missing_words?.length ?? 0}
                </Text>
                <Text style={styles.analysisLabel}>Não Detectadas</Text>
              </View>
              
              {/* Palavras Extras */}
              <View style={styles.analysisItem}>
                <Text style={[styles.analysisValue, { color: (recording.extra_words?.length ?? 0) > 0 ? '#f59e0b' : '#10b981' }]}>
                  {recording.extra_words?.length ?? 0}
                </Text>
                <Text style={styles.analysisLabel}>Palavras Extras</Text>
              </View>
              
              {/* Palavras Diferentes */}
              <View style={styles.analysisItem}>
                <Text style={[styles.analysisValue, { color: (recording.mispronounced_words?.length ?? 0) > 0 ? '#eab308' : '#10b981' }]}>
                  {recording.mispronounced_words?.length ?? 0}
                </Text>
                <Text style={styles.analysisLabel}>Pronúncia Diferente</Text>
              </View>
            </View>

            {/* Lista de palavras mal pronunciadas */}
            {recording.mispronounced_words && recording.mispronounced_words.length > 0 && (
              <View style={styles.mispronouncedSection}>
                <Text style={styles.mispronouncedTitle}>🔄 Palavras com pronúncia diferente:</Text>
                {recording.mispronounced_words.map((item: MispronouncedWord, idx: number) => (
                  <View key={idx} style={styles.mispronouncedRow}>
                    <Text style={styles.mispronouncedExpected}>"{item.expected}"</Text>
                    <Text style={styles.mispronouncedArrow}>→</Text>
                    <Text style={styles.mispronouncedHeard}>"{item.heard}"</Text>
                    <Text style={styles.mispronouncedSimilarity}>({(item.similarity * 100).toFixed(0)}%)</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Lista de palavras não detectadas */}
            {recording.missing_words && recording.missing_words.length > 0 && (
              <View style={styles.missingSection}>
                <Text style={styles.missingTitle}>⚠️ Palavras não detectadas:</Text>
                <Text style={styles.missingWords}>
                  {recording.missing_words.join(', ')}
                </Text>
              </View>
            )}

            {/* Lista de palavras extras */}
            {recording.extra_words && recording.extra_words.length > 0 && (
              <View style={styles.extraSection}>
                <Text style={styles.extraTitle}>➕ Palavras extras detectadas:</Text>
                <Text style={styles.extraWords}>
                  {recording.extra_words.join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}

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
  // Metrics Card styles
  metricsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  metricsCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricIdeal: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  // Audio card styles
  audioCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  audioCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  volumeStatItem: {
    alignItems: 'center',
  },
  volumeStatLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  volumeStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  // Diff comparison styles
  diffContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#262626',
  },
  diffTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  similarityBadge: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 16,
  },
  diffGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  diffColumn: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  diffHeaderExpected: {
    backgroundColor: '#374151',
    padding: 10,
    alignItems: 'center',
  },
  diffHeaderTranscribed: {
    backgroundColor: '#1e3a5f',
    padding: 10,
    alignItems: 'center',
  },
  diffHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  diffContent: {
    backgroundColor: '#262626',
    padding: 12,
    minHeight: 100,
  },
  diffText: {
    fontSize: 14,
    lineHeight: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  wordMatch: {
    color: '#9ca3af',
  },
  wordMissing: {
    color: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  wordCorrect: {
    color: '#10b981',
  },
  wordExtra: {
    color: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  wordMispronounced: {
    color: '#eab308',
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
  },
  // Legend styles
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  statText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  statMissing: {
    fontSize: 13,
    color: '#ef4444',
  },
  // Analysis Card styles
  analysisCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  analysisCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  analysisItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  analysisValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  analysisLabel: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  // Mispronounced section
  mispronouncedSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  mispronouncedTitle: {
    fontSize: 13,
    color: '#eab308',
    fontWeight: '600',
    marginBottom: 8,
  },
  mispronouncedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  mispronouncedExpected: {
    fontSize: 13,
    color: '#ef4444',
  },
  mispronouncedArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  mispronouncedHeard: {
    fontSize: 13,
    color: '#eab308',
  },
  mispronouncedSimilarity: {
    fontSize: 11,
    color: '#6b7280',
  },
  // Missing words section
  missingSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  missingTitle: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '600',
    marginBottom: 6,
  },
  missingWords: {
    fontSize: 13,
    color: '#d1d5db',
    lineHeight: 20,
  },
  // Extra words section
  extraSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  extraTitle: {
    fontSize: 13,
    color: '#f59e0b',
    fontWeight: '600',
    marginBottom: 6,
  },
  extraWords: {
    fontSize: 13,
    color: '#d1d5db',
    lineHeight: 20,
  },
});
