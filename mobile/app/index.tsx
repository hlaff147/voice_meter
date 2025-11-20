import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

const CATEGORIES = [
  {
    id: 'presentation',
    title: 'Apresentação',
    description: 'Palestras e apresentações formais',
    ppm: '140-160 PPM',
    icon: '🎤',
    color: '#10b981'
  },
  {
    id: 'pitch',
    title: 'Pitch',
    description: 'Vendas e apresentações de negócios',
    ppm: '120-150 PPM',
    icon: '💼',
    color: '#f59e0b'
  },
  {
    id: 'conversation',
    title: 'Conversação Diária',
    description: 'Conversas informais do dia a dia',
    ppm: '100-130 PPM',
    icon: '💬',
    color: '#3b82f6'
  },
  {
    id: 'other',
    title: 'Outros',
    description: 'Contextos personalizados',
    ppm: '110-140 PPM',
    icon: '✨',
    color: '#8b5cf6'
  }
];

export default function Index() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  
  // Responsividade: Define colunas baseado na largura
  const isDesktop = width > 768;
  const gap = 16;
  const padding = 20;
  
  // Calcula largura do card descontando padding e gap
  const cardWidth = isDesktop 
    ? (Math.min(width, 1024) - (padding * 2) - gap) / 2 
    : '100%';

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/recording?category=${categoryId}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Voice Meter</Text>
          <Text style={styles.subtitle}>O Leitor Lento</Text>
          <Text style={styles.description}>
            Monitore e refine a velocidade da sua fala. Selecione uma categoria para começar.
          </Text>
          
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => router.push('/history')}
          >
            <Text style={styles.historyButtonText}>📜 Ver Histórico</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.grid, { flexDirection: isDesktop ? 'row' : 'column', flexWrap: 'wrap' }]}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.card, 
                  { borderColor: category.color, width: cardWidth }
                ]}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.icon}>{category.icon}</Text>
                <Text style={styles.cardTitle}>{category.title}</Text>
                <Text style={styles.cardDescription}>{category.description}</Text>
                <View style={[styles.badge, { backgroundColor: category.color }]}>
                  <Text style={styles.badgeText}>{category.ppm}</Text>
                </View>
              </TouchableOpacity>
            ))}
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
    alignItems: 'center', // Centraliza no desktop
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 1024, // Limita largura em telas grandes
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
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
    color: '#9ca3af',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  historyButton: {
    marginTop: 20,
    backgroundColor: '#262626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  historyButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  grid: {
    gap: 16,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
