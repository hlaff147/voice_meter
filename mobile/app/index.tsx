import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
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

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/recording?category=${categoryId}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Voice Meter</Text>
        <Text style={styles.subtitle}>O Leitor Lento</Text>
        <Text style={styles.description}>
          Monitore e refine a velocidade da sua fala. Selecione uma categoria para começar.
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.card, { borderColor: category.color }]}
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
