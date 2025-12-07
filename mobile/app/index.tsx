import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isDesktop = width > 768;

  const handleStartPress = () => {
    router.push('/recording');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Medidor de Voz</Text>
          <Text style={styles.subtitle}>Treinamento de Apresentação</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Card */}
          <View style={styles.heroCard}>
            <Text style={styles.heroIcon}>🎤</Text>
            <Text style={styles.heroTitle}>Modo Apresentação</Text>
            <Text style={styles.heroDescription}>
              Compare sua fala com o texto que você pretende dizer. O sistema irá:
            </Text>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📝</Text>
                <Text style={styles.featureText}>Receber o texto da sua fala</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🎙️</Text>
                <Text style={styles.featureText}>Gravar sua apresentação</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🤖</Text>
                <Text style={styles.featureText}>Transcrever usando IA (Whisper)</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📊</Text>
                <Text style={styles.featureText}>Comparar e dar feedback</Text>
              </View>
            </View>

            <View style={styles.ppmBadge}>
              <Text style={styles.ppmText}>Velocidade ideal: 140-160 PPM</Text>
            </View>
          </View>

          {/* Start Button */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartPress}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>🚀 Iniciar Treinamento</Text>
          </TouchableOpacity>

          {/* History Button */}
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => router.push('/history')}
          >
            <Text style={styles.historyButtonText}>📜 Ver Histórico de Gravações</Text>
          </TouchableOpacity>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 Como funciona?</Text>
            <Text style={styles.infoText}>
              1. Digite o texto que você pretende falar na apresentação{'\n\n'}
              2. Grave seu áudio lendo o texto{'\n\n'}
              3. Nossa IA transcreve o que você disse{'\n\n'}
              4. Receba feedback detalhado sobre pronúncia, velocidade e precisão
            </Text>
          </View>
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#10b981',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 28,
    borderWidth: 2,
    borderColor: '#10b981',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  featureList: {
    width: '100%',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 10,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#d1d5db',
  },
  ppmBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ppmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  historyButton: {
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  historyButtonText: {
    color: '#3b82f6',
    fontSize: 15,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#262626',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 22,
  },
});
