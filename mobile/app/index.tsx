import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useRef, useEffect } from 'react';

export default function Index() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const isDesktop = width > 768;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleStartPress = () => {
    router.push('/recording');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Voice Meter</Text>
          <Text style={styles.subtitle}>Treinamento de Apresentação</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Simplified Hero Card */}
          <View style={styles.heroCard}>
            <Text style={styles.heroIcon}>🎤</Text>
            <Text style={styles.heroTitle}>Pratique sua Apresentação</Text>
            <Text style={styles.heroDescription}>
              Compare o que você quer dizer com o que realmente disse. Receba feedback instantâneo sobre pronúncia, velocidade e precisão.
            </Text>
          </View>

          {/* Main CTA Button with Animation */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartPress}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonIcon}>🚀</Text>
              <Text style={styles.startButtonText}>Iniciar Treinamento</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Quick Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>140-160</Text>
              <Text style={styles.statLabel}>PPM ideal</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>IA</Text>
              <Text style={styles.statLabel}>Whisper</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>pt-BR</Text>
              <Text style={styles.statLabel}>Idioma</Text>
            </View>
          </View>

          {/* History Button */}
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => router.push('/history')}
          >
            <Text style={styles.historyButtonIcon}>📜</Text>
            <View style={styles.historyButtonContent}>
              <Text style={styles.historyButtonText}>Ver Histórico</Text>
              <Text style={styles.historyButtonSubtext}>Suas gravações anteriores</Text>
            </View>
            <Text style={styles.historyButtonArrow}>→</Text>
          </TouchableOpacity>

          {/* How it works - Compact */}
          <View style={styles.stepsContainer}>
            <Text style={styles.stepsTitle}>Como funciona</Text>
            <View style={styles.stepsRow}>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                <Text style={styles.stepText}>Digite o texto</Text>
              </View>
              <View style={styles.stepConnector} />
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                <Text style={styles.stepText}>Grave o áudio</Text>
              </View>
              <View style={styles.stepConnector} />
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                <Text style={styles.stepText}>Veja o resultado</Text>
              </View>
            </View>
          </View>
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
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
    backgroundColor: '#1c1c1e',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  heroIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 15,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    gap: 10,
  },
  startButtonIcon: {
    fontSize: 22,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#71717a',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#2c2c2e',
  },
  historyButton: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  historyButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  historyButtonContent: {
    flex: 1,
  },
  historyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyButtonSubtext: {
    color: '#71717a',
    fontSize: 13,
    marginTop: 2,
  },
  historyButtonArrow: {
    color: '#3b82f6',
    fontSize: 20,
    fontWeight: '600',
  },
  stepsContainer: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 12,
    color: '#d1d5db',
    textAlign: 'center',
  },
  stepConnector: {
    height: 2,
    width: 20,
    backgroundColor: '#2c2c2e',
    marginTop: -12,
  },
});

