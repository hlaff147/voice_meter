import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Animated, Easing, Modal, useWindowDimensions, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { apiService } from '../src/services/api';
import TextDiff from '../src/components/TextDiff';

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
              {/* Main Score Card */}
              <View style={[styles.scoreCard, { borderColor: getScoreColor(result.pronunciation_score || result.overall_score) }]}>
                <Text style={styles.scoreLabel}>PONTUAÇÃO DE PRONÚNCIA</Text>
                <Text style={[styles.scoreValue, { color: getScoreColor(result.pronunciation_score || result.overall_score) }]}>
                  {result.pronunciation_score || result.overall_score}
                </Text>
                <Text style={styles.scoreSubtext}>
                  {(result.similarity_ratio * 100).toFixed(1)}% de similaridade
                </Text>
              </View>

              {/* Visual Diff Comparison */}
              <View style={styles.comparisonCard}>
                <Text style={styles.comparisonTitle}>📝 Comparação de Texto</Text>
                {result.expected_text && result.transcribed_text ? (
                  <View style={styles.diffWrapper}>
                    <TextDiff
                      expectedText={result.expected_text}
                      transcribedText={result.transcribed_text}
                      showLegend={true}
                    />
                  </View>
                ) : (
                  <Text style={styles.textBoxContent}>
                    {result.transcribed_text || 'Não foi possível transcrever'}
                  </Text>
                )}
              </View>

              {/* Metrics Grid */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Velocidade</Text>
                  <Text style={styles.metricValue}>{Math.round(result.articulation_rate)} PPM</Text>
                  <Text style={[styles.metricStatus, { color: result.is_within_range ? '#10b981' : '#f59e0b' }]}>
                    {result.is_within_range ? '✓ Ideal' : '⚠️ Ajustar'}
                  </Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Palavras</Text>
                  <Text style={styles.metricValue}>
                    {result.transcribed_word_count || '—'}/{result.expected_word_count || '—'}
                  </Text>
                  <Text style={styles.metricStatus}>detectadas/esperadas</Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Precisão</Text>
                  <Text style={styles.metricValue}>
                    {result.word_accuracy ? (result.word_accuracy * 100).toFixed(0) : '—'}%
                  </Text>
                  <Text style={styles.metricStatus}>por palavra</Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Duração</Text>
                  <Text style={styles.metricValue}>{result.duration_seconds?.toFixed(1)}s</Text>
                  <Text style={styles.metricStatus}>{result.pause_count} pausas</Text>
                </View>
              </View>

              {/* Issues Found */}
              {(result.missing_words?.length > 0 || result.mispronounced_words?.length > 0) && (
                <View style={styles.issuesCard}>
                  <Text style={styles.issuesTitle}>⚠️ Pontos de Atenção</Text>

                  {result.missing_words?.length > 0 && (
                    <View style={styles.issueSection}>
                      <Text style={styles.issueLabel}>Palavras não detectadas:</Text>
                      <Text style={styles.issueWords}>{result.missing_words.slice(0, 5).join(', ')}</Text>
                    </View>
                  )}

                  {result.mispronounced_words?.length > 0 && (
                    <View style={styles.issueSection}>
                      <Text style={styles.issueLabel}>Pronúncia diferente:</Text>
                      {result.mispronounced_words.slice(0, 3).map((mp: any, idx: number) => (
                        <Text key={idx} style={styles.issueWords}>
                          "{mp.expected}" → "{mp.heard}"
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Feedback */}
              {result.comparison_feedback && (
                <View style={styles.feedbackCard}>
                  <Text style={styles.feedbackText}>{result.comparison_feedback}</Text>
                </View>
              )}

              {/* Action Buttons */}
              {result.recording_id && (
                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={() => router.push(`/recording-detail?id=${result.recording_id}`)}
                >
                  <Text style={styles.detailButtonText}>📊 Ver Detalhes Completos</Text>
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
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
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
    color: '#a1a1aa',
    marginBottom: 16,
    lineHeight: 22,
  },
  textInput: {
    backgroundColor: '#1c1c1e',
    borderWidth: 2,
    borderColor: '#2c2c2e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 180,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    color: '#71717a',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  textPreviewTitle: {
    fontSize: 14,
    color: '#a1a1aa',
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
    color: '#a1a1aa',
    fontWeight: '600',
  },
  uploadContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  orText: {
    color: '#71717a',
    fontSize: 14,
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#252528',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#3c3c3f',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scoreCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    borderWidth: 3,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#a1a1aa',
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
    color: '#a1a1aa',
  },
  comparisonCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  diffWrapper: {
    marginHorizontal: -16,
    marginBottom: -16,
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
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    padding: 14,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#a1a1aa',
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
    color: '#71717a',
  },
  issuesCard: {
    backgroundColor: '#1c1c1e',
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
    color: '#a1a1aa',
    marginBottom: 4,
  },
  issueWords: {
    fontSize: 14,
    color: '#d1d5db',
  },
  feedbackCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  feedbackText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 24,
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
    borderColor: '#3c3c3f',
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
    backgroundColor: '#1c1c1e',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubText: {
    color: '#a1a1aa',
    fontSize: 14,
    textAlign: 'center',
  },
});
