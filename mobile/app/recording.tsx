import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Animated, Easing, Modal, useWindowDimensions, ScrollView, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { apiService } from '../src/services/api';

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

export default function Recording() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [expectedText, setExpectedText] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [step, setStep] = useState<'text' | 'record' | 'result'>('text');

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
  }, []);

  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    if (isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => animation?.stop();
  }, [isRecording]);

  const handleContinueToRecord = () => {
    if (!expectedText.trim()) {
      Alert.alert('Texto Obrigatório', 'Por favor, digite o texto que você pretende falar na apresentação.');
      return;
    }
    setStep('record');
  };

  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        const permission = await requestPermission();
        if (!permission.granted) {
          Alert.alert('Permissão negada', 'Precisamos de permissão para usar o microfone');
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setResult(null);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Erro', 'Não foi possível iniciar a gravação');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    const uri = recording.getURI();
    if (uri) {
      await analyzeAudio(uri);
    }
    setRecording(null);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*', 'video/mp4'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      if (asset) {
        await analyzeAudio(asset.uri, {
          name: asset.name,
          type: asset.mimeType || 'audio/mpeg',
        });
      }
    } catch (err) {
      console.error('Failed to pick document', err);
      Alert.alert('Erro', 'Não foi possível selecionar o arquivo');
    }
  };

  const analyzeAudio = async (uri: string, fileInfo?: { name: string, type: string }) => {
    setAnalyzing(true);
    try {
      const analysisResult = await apiService.analyzeSpeech(uri, 'presentation', expectedText, fileInfo);
      setResult(analysisResult);
      setStep('result');
    } catch (error: any) {
      Alert.alert(
        'Erro',
        `Não foi possível analisar o áudio.\n\nDetalhes: ${error.response?.data?.detail || error.message}`
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRecordPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleTryAgain = () => {
    setResult(null);
    setStep('text');
    setExpectedText('');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  // Step 1: Enter expected text
  if (step === 'text') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style="light" />

        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>← Voltar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, styles.stepDotActive]} />
              <View style={styles.stepLine} />
              <View style={styles.stepDot} />
              <View style={styles.stepLine} />
              <View style={styles.stepDot} />
            </View>
            <Text style={styles.stepLabel}>Passo 1 de 3: Digite seu texto</Text>

            <Text style={styles.sectionTitle}>📝 Texto da Apresentação</Text>
            <Text style={styles.sectionDescription}>
              Digite o texto que você pretende falar. Depois iremos comparar com o que você realmente disse.
            </Text>

            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={8}
              placeholder="Digite aqui o texto da sua apresentação..."
              placeholderTextColor="#6b7280"
              value={expectedText}
              onChangeText={setExpectedText}
              textAlignVertical="top"
            />

            <Text style={styles.charCount}>
              {expectedText.split(/\s+/).filter(w => w.length > 0).length} palavras
            </Text>

            <TouchableOpacity
              style={[
                styles.continueButton,
                !expectedText.trim() && styles.continueButtonDisabled
              ]}
              onPress={handleContinueToRecord}
              disabled={!expectedText.trim()}
            >
              <Text style={styles.continueButtonText}>Continuar para Gravação →</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Step 2: Record audio
  if (step === 'record') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />

        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setStep('text')} style={styles.backButton}>
              <Text style={styles.backText}>← Voltar ao Texto</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, styles.stepDotCompleted]} />
              <View style={[styles.stepLine, styles.stepLineCompleted]} />
              <View style={[styles.stepDot, styles.stepDotActive]} />
              <View style={styles.stepLine} />
              <View style={styles.stepDot} />
            </View>
            <Text style={styles.stepLabel}>Passo 2 de 3: Grave seu áudio</Text>

            {/* Expected text preview */}
            <View style={styles.textPreviewCard}>
              <Text style={styles.textPreviewTitle}>📄 Seu texto:</Text>
              <Text style={styles.textPreviewContent} numberOfLines={4}>
                {expectedText}
              </Text>
            </View>

            {/* Recording Button */}
            <View style={styles.recordingContainer}>
              <Text style={styles.recordingInstruction}>
                {isRecording ? '🔴 Gravando... Toque para parar' : '🎙️ Toque para começar a gravar'}
              </Text>

              <TouchableOpacity
                onPress={handleRecordPress}
                disabled={analyzing}
                activeOpacity={0.8}
              >
                <Animated.View
                  style={[
                    styles.recordButton,
                    {
                      backgroundColor: isRecording ? '#ef4444' : '#10b981',
                      transform: [{ scale: pulseAnim }]
                    },
                    analyzing && styles.recordButtonDisabled
                  ]}
                >
                  {analyzing ? (
                    <ActivityIndicator size="large" color="#fff" />
                  ) : (
                    <Text style={styles.micIcon}>{isRecording ? '⏹️' : '🎙️'}</Text>
                  )}
                </Animated.View>
              </TouchableOpacity>

              <Text style={styles.recordLabel}>
                {analyzing ? 'Analisando com IA...' : isRecording ? 'Toque para parar' : 'Toque para gravar'}
              </Text>
            </View>

            {/* Upload Button */}
            {!isRecording && !analyzing && (
              <View style={styles.uploadContainer}>
                <Text style={styles.orText}>— ou —</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={pickDocument}
                >
                  <Text style={styles.uploadButtonText}>📂 Carregar Arquivo de Áudio</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Loading Overlay */}
        <Modal transparent visible={analyzing} animationType="fade">
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={styles.loadingText}>Analisando com Whisper AI...</Text>
              <Text style={styles.loadingSubText}>Transcrevendo e comparando seu áudio</Text>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Step 3: Results
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Início</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, styles.stepDotCompleted]} />
            <View style={[styles.stepLine, styles.stepLineCompleted]} />
            <View style={[styles.stepDot, styles.stepDotCompleted]} />
            <View style={[styles.stepLine, styles.stepLineCompleted]} />
            <View style={[styles.stepDot, styles.stepDotActive]} />
          </View>
          <Text style={styles.stepLabel}>Passo 3 de 3: Resultado</Text>

          {result && (
            <>
              {/* Git-diff Style Comparison */}
              <View style={styles.diffContainer}>
                <Text style={styles.diffTitle}>📊 Comparação de Textos</Text>
                <Text style={styles.similarityBadge}>
                  {(result.similarity_ratio * 100).toFixed(0)}% similaridade
                </Text>

                <View style={styles.diffGrid}>
                  {/* Expected Text Column */}
                  <View style={styles.diffColumn}>
                    <View style={styles.diffHeaderExpected}>
                      <Text style={styles.diffHeaderText}>📄 ESPERADO</Text>
                    </View>
                    <View style={styles.diffContent}>
                      <Text style={styles.diffText}>
                        {result.expected_text?.split(' ').map((word: string, idx: number) => {
                          const transcribedWords = (result.transcribed_text || '').toLowerCase().split(' ');
                          const isPresent = transcribedWords.includes(word.toLowerCase().replace(/[.,!?]/g, ''));
                          return (
                            <Text
                              key={idx}
                              style={isPresent ? styles.wordMatch : styles.wordMissing}
                            >
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
                        {result.transcribed_text ? result.transcribed_text.split(' ').map((word: string, idx: number) => {
                          const expectedWords = (result.expected_text || '').toLowerCase().split(' ').map((w: string) => w.replace(/[.,!?]/g, ''));
                          const isExpected = expectedWords.includes(word.toLowerCase().replace(/[.,!?]/g, ''));
                          return (
                            <Text
                              key={idx}
                              style={isExpected ? styles.wordCorrect : styles.wordExtra}
                            >
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
                    {result.transcribed_word_count || 0} / {result.expected_word_count || 0} palavras detectadas
                  </Text>
                  {result.missing_words?.length > 0 && (
                    <Text style={styles.statMissing}>
                      {result.missing_words.length} não encontradas
                    </Text>
                  )}
                </View>
              </View>

              {/* Volume Chart Card */}
              {result.volume_data && result.volume_data.length > 0 && (
                <View style={styles.audioCard}>
                  <Text style={styles.audioCardTitle}>🔊 Volume do Áudio</Text>
                  {renderVolumeChart(result.volume_data, width)}
                  <View style={styles.volumeStats}>
                    <View style={styles.volumeStatItem}>
                      <Text style={styles.volumeStatLabel}>Mín</Text>
                      <Text style={styles.volumeStatValue}>{result.volume_min?.toFixed(0) || 0}%</Text>
                    </View>
                    <View style={styles.volumeStatItem}>
                      <Text style={styles.volumeStatLabel}>Média</Text>
                      <Text style={styles.volumeStatValue}>{result.volume_avg?.toFixed(0) || 0}%</Text>
                    </View>
                    <View style={styles.volumeStatItem}>
                      <Text style={styles.volumeStatLabel}>Máx</Text>
                      <Text style={styles.volumeStatValue}>{result.volume_max?.toFixed(0) || 0}%</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Metrics Card - Velocidade e Pausas */}
              <View style={styles.metricsCard}>
                <Text style={styles.metricsCardTitle}>📈 Métricas de Fala</Text>
                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricValue}>{result.words_per_minute || result.articulation_rate || 0}</Text>
                    <Text style={styles.metricLabel}>palavras/min</Text>
                    <Text style={styles.metricIdeal}>Ideal: {result.ideal_min_ppm || 140}-{result.ideal_max_ppm || 160}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricValue}>{result.pause_count || 0}</Text>
                    <Text style={styles.metricLabel}>pausas</Text>
                    <Text style={styles.metricIdeal}>detectadas</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricValue}>{result.duration_seconds?.toFixed(1) || 0}s</Text>
                    <Text style={styles.metricLabel}>duração</Text>
                    <Text style={styles.metricIdeal}>total</Text>
                  </View>
                </View>
              </View>

              {/* Feedback Card */}
              <View style={[
                styles.feedbackCard,
                { borderColor: (result.similarity_ratio * 100) >= 70 ? '#10b981' : '#f59e0b' }
              ]}>
                <Text style={[
                  styles.feedbackTitle,
                  { color: (result.similarity_ratio * 100) >= 70 ? '#10b981' : '#f59e0b' }
                ]}>
                  {(result.similarity_ratio * 100) >= 90 ? '🎉 Excelente!' : 
                   (result.similarity_ratio * 100) >= 70 ? '👍 Bom trabalho!' : 
                   (result.similarity_ratio * 100) >= 50 ? '💪 Continue praticando!' : '📚 Precisa melhorar'}
                </Text>
                <Text style={styles.feedbackText}>
                  {(result.similarity_ratio * 100) >= 90 
                    ? 'Sua pronúncia está muito próxima do texto esperado. Parabéns!' 
                    : (result.similarity_ratio * 100) >= 70 
                    ? 'Você está no caminho certo! Algumas palavras podem ser melhoradas.'
                    : (result.similarity_ratio * 100) >= 50
                    ? 'Pratique mais as palavras destacadas em vermelho para melhorar.'
                    : 'Revise o texto e pratique a pronúncia das palavras não detectadas.'}
                </Text>
                {result.missing_words?.length > 0 && (
                  <Text style={styles.feedbackMissing}>
                    ⚠️ Palavras não detectadas: {result.missing_words.slice(0, 5).join(', ')}
                    {result.missing_words.length > 5 ? ` (+${result.missing_words.length - 5} mais)` : ''}
                  </Text>
                )}
              </View>

              {/* Action Buttons */}
              {result.recording_id && (
                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={() => router.push(`/recording-detail?id=${result.recording_id}`)}
                >
                  <Text style={styles.detailButtonText}>📋 Ver Detalhes Completos</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.tryAgainButton}
                onPress={handleTryAgain}
              >
                <Text style={styles.tryAgainText}>🔄 Nova Gravação</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
  },
  backText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  // Step indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 10,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#404040',
  },
  stepDotActive: {
    backgroundColor: '#10b981',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  stepDotCompleted: {
    backgroundColor: '#10b981',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#404040',
    marginHorizontal: 8,
  },
  stepLineCompleted: {
    backgroundColor: '#10b981',
  },
  stepLabel: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 24,
  },
  // Text input step
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
    lineHeight: 20,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#262626',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 180,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    color: '#6b7280',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#404040',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Recording step
  textPreviewCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#262626',
  },
  textPreviewTitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  textPreviewContent: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  recordingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  recordingInstruction: {
    fontSize: 16,
    color: '#d1d5db',
    marginBottom: 24,
    textAlign: 'center',
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonDisabled: {
    opacity: 0.6,
  },
  micIcon: {
    fontSize: 48,
  },
  recordLabel: {
    marginTop: 20,
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  uploadContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  orText: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#262626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#404040',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Results step
  scoreCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 3,
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
    fontSize: 64,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
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
    marginBottom: 0,
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
    borderWidth: 1,
    borderColor: '#262626',
    padding: 14,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  metricStatus: {
    fontSize: 11,
    color: '#6b7280',
  },
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
  },
  feedbackCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#262626',
  },
  feedbackText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 22,
  },
  detailButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  detailButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tryAgainButton: {
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#404040',
  },
  tryAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Loading overlay
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#1a1a1a',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    width: '80%',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
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
  volumeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
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
  // Metrics card styles
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
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  metricLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  metricIdeal: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  // Feedback card styles
  feedbackCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
    textAlign: 'center',
  },
  feedbackText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 22,
    textAlign: 'center',
  },
  feedbackMissing: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 12,
    textAlign: 'center',
  },
  // Detail button styles
  detailButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  detailButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
