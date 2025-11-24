import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Animated, Easing, Modal, useWindowDimensions, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { apiService } from '../src/services/api';

const CATEGORY_INFO: Record<string, { title: string; ppm: string; color: string; icon: string }> = {
  presentation: { title: 'Apresentação', ppm: '140-160 PPM', color: '#10b981', icon: '🎤' },
  pitch: { title: 'Pitch', ppm: '120-150 PPM', color: '#f59e0b', icon: '💼' },
  conversation: { title: 'Conversação Diária', ppm: '100-130 PPM', color: '#3b82f6', icon: '💬' },
  other: { title: 'Outros', ppm: '110-140 PPM', color: '#8b5cf6', icon: '✨' },
};

export default function Recording() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const category = params.category as string || 'other';
  const categoryInfo = CATEGORY_INFO[category] || CATEGORY_INFO.other;

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

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
        type: ['audio/*', 'video/mp4'], // Allow audio and mp4 video (often used for audio)
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      if (asset) {
        await analyzeAudio(asset.uri, {
          name: asset.name,
          type: asset.mimeType || 'audio/mpeg', // Default to audio/mpeg if unknown
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
      const result = await apiService.analyzeSpeech(uri, category, fileInfo);
      setResult(result);
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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Category Info */}
          <View style={styles.categoryContainer}>
            <Text style={styles.icon}>{categoryInfo.icon}</Text>
            <Text style={styles.categoryTitle}>{categoryInfo.title}</Text>
            <Text style={styles.idealSpeed}>Velocidade ideal: {categoryInfo.ppm}</Text>
            <Text style={styles.instruction}>
              {isRecording ? 'Gravando... Toque novamente para parar' : 'Toque no botão para começar a gravar'}
            </Text>
          </View>

          {/* Recording Button */}
          <View style={styles.recordingContainer}>
            <TouchableOpacity
              onPress={handleRecordPress}
              disabled={analyzing}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.recordButton,
                  { 
                    backgroundColor: isRecording ? '#ef4444' : categoryInfo.color,
                    transform: [{ scale: pulseAnim }]
                  },
                  analyzing && styles.recordButtonDisabled
                ]}
              >
                {analyzing ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <Text style={styles.micIcon}>{isRecording ? '⏸' : '🎙️'}</Text>
                )}
              </Animated.View>
            </TouchableOpacity>
            <Text style={styles.recordLabel}>
              {analyzing ? 'Analisando...' : isRecording ? 'Toque para parar' : 'Toque para gravar'}
            </Text>
          </View>

          {/* Upload Button */}
          {!isRecording && !analyzing && !result && (
            <View style={styles.uploadContainer}>
              <TouchableOpacity 
                style={styles.uploadButton} 
                onPress={pickDocument}
              >
                <Text style={styles.uploadButtonText}>📂 Carregar Arquivo de Áudio</Text>
              </TouchableOpacity>
              <Text style={styles.uploadHint}>Suporta MP3, WAV, M4A, MP4</Text>
            </View>
          )}

          {/* Results */}
          {result && (
            <View style={styles.resultContainer}>
              <View style={[styles.resultCard, { borderColor: categoryInfo.color }]}>
                <Text style={styles.resultTitle}>Resultado da Análise</Text>
                
                <View style={styles.resultGrid}>
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>Velocidade (AR)</Text>
                    <Text style={[styles.resultValue, { color: categoryInfo.color }]}>
                      {result.articulation_rate} PPM
                    </Text>
                  </View>

                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>Duração</Text>
                    <Text style={styles.resultValue}>{result.duration_seconds}s</Text>
                  </View>
                  
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>Pausas</Text>
                    <Text style={styles.resultValue}>{result.pause_count} ({result.silence_ratio}%)</Text>
                  </View>
                  
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>Inteligibilidade</Text>
                    <Text style={[
                      styles.resultValue, 
                      { color: result.intelligibility_score > 80 ? '#10b981' : result.intelligibility_score > 60 ? '#f59e0b' : '#ef4444' }
                    ]}>
                      {result.intelligibility_score}%
                    </Text>
                  </View>
                </View>

                <View style={styles.feedbackContainer}>
                  <Text style={styles.feedbackTitle}>Feedback</Text>
                  <Text style={styles.feedback}>{result.feedback}</Text>
                </View>

                {result.recording_id && (
                  <TouchableOpacity 
                    style={[styles.detailButton, { backgroundColor: '#3b82f6' }]}
                    onPress={() => router.push(`/recording-detail?id=${result.recording_id}`)}
                  >
                    <Text style={styles.detailButtonText}>📊 Ver Detalhes Completos</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  style={[styles.tryAgainButton, { backgroundColor: categoryInfo.color }]}
                  onPress={() => setResult(null)}
                >
                  <Text style={styles.tryAgainText}>Tentar Novamente</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Loading Overlay */}
      <Modal transparent visible={analyzing} animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={categoryInfo.color} />
            <Text style={styles.loadingText}>Analisando seu áudio...</Text>
            <Text style={styles.loadingSubText}>Isso pode levar alguns segundos</Text>
          </View>
        </View>
      </Modal>
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
    maxWidth: 800, // Max width for desktop
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  categoryContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  idealSpeed: {
    fontSize: 18,
    color: '#9ca3af',
    marginBottom: 16,
  },
  instruction: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: 280,
  },
  recordingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
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
    marginTop: 24,
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '600',
  },
  uploadContainer: {
    alignItems: 'center',
    marginBottom: 20,
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
  uploadHint: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 8,
  },
  resultContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  resultCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  resultItem: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: '#262626',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  feedbackContainer: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#262626',
    borderRadius: 12,
  },
  feedbackTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  feedback: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  tryAgainButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  tryAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  detailButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#1a1a1a',
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
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
});
