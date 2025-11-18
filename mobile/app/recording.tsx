import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
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
  const category = params.category as string || 'other';
  const categoryInfo = CATEGORY_INFO[category] || CATEGORY_INFO.other;

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  useEffect(() => {
    // Configure audio mode
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
  }, []);

  const startRecording = async () => {
    try {
      // Request permission
      if (permissionResponse?.status !== 'granted') {
        console.log('Requesting permission..');
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

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setResult(null);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Erro', 'Não foi possível iniciar a gravação');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    console.log('Stopping recording..');
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    
    const uri = recording.getURI();
    console.log('Recording stopped and stored at', uri);
    
    if (uri) {
      await analyzeAudio(uri);
    }
    
    setRecording(null);
  };

  const analyzeAudio = async (uri: string) => {
    setAnalyzing(true);
    try {
      console.log('📊 Starting audio analysis...');
      console.log('📍 Audio URI:', uri);
      console.log('🏷️ Category:', category);
      
      const result = await apiService.analyzeSpeech(uri, category);
      console.log('✅ Analysis successful:', result);
      setResult(result);
    } catch (error: any) {
      console.error('❌ Error analyzing audio:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
      </View>

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
          style={[
            styles.recordButton,
            { backgroundColor: isRecording ? '#ef4444' : categoryInfo.color },
            analyzing && styles.recordButtonDisabled
          ]}
          onPress={handleRecordPress}
          disabled={analyzing}
          activeOpacity={0.8}
        >
          {analyzing ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <Text style={styles.micIcon}>{isRecording ? '⏸' : '🎙️'}</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.recordLabel}>
          {analyzing ? 'Analisando...' : isRecording ? 'Toque para parar' : 'Toque para gravar'}
        </Text>
      </View>

      {/* Results */}
      {result && (
        <View style={styles.resultContainer}>
          <View style={[styles.resultCard, { borderColor: categoryInfo.color }]}>
            <Text style={styles.resultTitle}>Resultado da Análise</Text>
            
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Velocidade:</Text>
              <Text style={[styles.resultValue, { color: categoryInfo.color }]}>
                {result.words_per_minute} PPM
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Duração:</Text>
              <Text style={styles.resultValue}>{result.duration_seconds}s</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Confiança:</Text>
              <Text style={styles.resultValue}>{result.confidence}%</Text>
            </View>

            <View style={styles.feedbackContainer}>
              <Text style={styles.feedback}>{result.feedback}</Text>
            </View>

            <TouchableOpacity 
              style={[styles.tryAgainButton, { backgroundColor: categoryInfo.color }]}
              onPress={() => setResult(null)}
            >
              <Text style={styles.tryAgainText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  recordButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
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
    fontSize: 64,
  },
  recordLabel: {
    marginTop: 24,
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '600',
  },
  resultContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 16,
    color: '#9ca3af',
  },
  resultValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  feedbackContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
  },
  feedback: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
    textAlign: 'center',
  },
  tryAgainButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  tryAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
