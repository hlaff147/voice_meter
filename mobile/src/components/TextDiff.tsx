import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';

interface DiffSegment {
    text: string;
    type: 'match' | 'removed' | 'added';
}

interface TextDiffProps {
    expectedText: string;
    transcribedText: string;
    showLegend?: boolean;
}

/**
 * Compute Longest Common Subsequence of two word arrays
 */
const computeLCS = (a: string[], b: string[]): string[] => {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // Backtrack to find LCS
    const lcs: string[] = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
        if (a[i - 1] === b[j - 1]) {
            lcs.unshift(a[i - 1]);
            i--;
            j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }

    return lcs;
};

/**
 * Gera os segmentos de diff para o texto esperado (lado esquerdo)
 */
const computeExpectedDiff = (expected: string[], transcribed: string[]): DiffSegment[] => {
    const lcs = computeLCS(expected, transcribed);
    const result: DiffSegment[] = [];

    let lcsIdx = 0;
    for (let i = 0; i < expected.length; i++) {
        if (lcsIdx < lcs.length && expected[i] === lcs[lcsIdx]) {
            result.push({ text: expected[i], type: 'match' });
            lcsIdx++;
        } else {
            result.push({ text: expected[i], type: 'removed' });
        }
    }

    return result;
};

/**
 * Gera os segmentos de diff para o texto transcrito (lado direito)
 */
const computeTranscribedDiff = (expected: string[], transcribed: string[]): DiffSegment[] => {
    const lcs = computeLCS(expected, transcribed);
    const result: DiffSegment[] = [];

    let lcsIdx = 0;
    for (let i = 0; i < transcribed.length; i++) {
        if (lcsIdx < lcs.length && transcribed[i] === lcs[lcsIdx]) {
            result.push({ text: transcribed[i], type: 'match' });
            lcsIdx++;
        } else {
            result.push({ text: transcribed[i], type: 'added' });
        }
    }

    return result;
};

export const TextDiff: React.FC<TextDiffProps> = ({
    expectedText,
    transcribedText,
    showLegend = true
}) => {
    const { width } = useWindowDimensions();

    const expectedWords = expectedText.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const transcribedWords = transcribedText.toLowerCase().split(/\s+/).filter(w => w.length > 0);

    const expectedDiff = computeExpectedDiff(expectedWords, transcribedWords);
    const transcribedDiff = computeTranscribedDiff(expectedWords, transcribedWords);

    // Conta remoções e adições
    const removedCount = expectedDiff.filter(s => s.type === 'removed').length;
    const addedCount = transcribedDiff.filter(s => s.type === 'added').length;

    const renderSegment = (segment: DiffSegment, index: number, side: 'left' | 'right') => {
        let style = styles.matchWord;
        if (segment.type === 'removed') {
            style = styles.removedWord;
        } else if (segment.type === 'added') {
            style = styles.addedWord;
        }

        return (
            <Text key={`${side}-${index}`} style={[styles.word, style]}>
                {segment.text}{' '}
            </Text>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header com estatísticas */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={[styles.statBadge, styles.removedBadge]}>
                        <Text style={styles.statBadgeText}>− {removedCount} faltando</Text>
                    </View>
                    <Text style={styles.headerLabel}>Esperado</Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={[styles.statBadge, styles.addedBadge]}>
                        <Text style={styles.statBadgeText}>+ {addedCount} extra</Text>
                    </View>
                    <Text style={styles.headerLabel}>Obtido</Text>
                </View>
            </View>

            {/* Side-by-side Diff */}
            <View style={styles.diffRow}>
                {/* Lado Esquerdo - Esperado */}
                <View style={styles.diffColumn}>
                    <View style={[styles.diffContent, styles.diffContentLeft]}>
                        <View style={styles.lineNumber}>
                            <Text style={styles.lineNumberText}>1</Text>
                        </View>
                        <View style={styles.textContent}>
                            {expectedDiff.map((segment, index) =>
                                renderSegment(segment, index, 'left')
                            )}
                        </View>
                    </View>
                </View>

                {/* Divisor */}
                <View style={styles.divider} />

                {/* Lado Direito - Obtido */}
                <View style={styles.diffColumn}>
                    <View style={[styles.diffContent, styles.diffContentRight]}>
                        <View style={styles.lineNumber}>
                            <Text style={styles.lineNumberText}>1</Text>
                        </View>
                        <View style={styles.textContent}>
                            {transcribedDiff.map((segment, index) =>
                                renderSegment(segment, index, 'right')
                            )}
                        </View>
                    </View>
                </View>
            </View>

            {/* Legenda */}
            {showLegend && (
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendSwatch, styles.removedSwatch]} />
                        <Text style={styles.legendText}>Palavra faltando</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendSwatch, styles.addedSwatch]} />
                        <Text style={styles.legendText}>Palavra extra</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#18181b',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#27272a',
    },
    header: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#27272a',
        backgroundColor: '#1f1f23',
    },
    headerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRightWidth: 1,
        borderRightColor: '#27272a',
        gap: 10,
    },
    headerRight: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 10,
    },
    headerLabel: {
        color: '#a1a1aa',
        fontSize: 13,
        fontWeight: '600',
    },
    statBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    removedBadge: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    addedBadge: {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
    },
    statBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    diffRow: {
        flexDirection: 'row',
    },
    diffColumn: {
        flex: 1,
    },
    divider: {
        width: 1,
        backgroundColor: '#27272a',
    },
    diffContent: {
        flexDirection: 'row',
        minHeight: 80,
    },
    diffContentLeft: {
        backgroundColor: 'rgba(239, 68, 68, 0.03)',
    },
    diffContentRight: {
        backgroundColor: 'rgba(34, 197, 94, 0.03)',
    },
    lineNumber: {
        width: 32,
        paddingVertical: 12,
        paddingHorizontal: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#27272a',
    },
    lineNumberText: {
        color: '#52525b',
        fontSize: 12,
        fontFamily: 'monospace',
    },
    textContent: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 12,
        alignContent: 'flex-start',
    },
    word: {
        fontSize: 14,
        lineHeight: 24,
    },
    matchWord: {
        color: '#d4d4d8',
    },
    removedWord: {
        color: '#fca5a5',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        textDecorationLine: 'line-through',
        paddingHorizontal: 2,
        borderRadius: 2,
        overflow: 'hidden',
    },
    addedWord: {
        color: '#86efac',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        paddingHorizontal: 2,
        borderRadius: 2,
        overflow: 'hidden',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        paddingVertical: 10,
        backgroundColor: '#1f1f23',
        borderTopWidth: 1,
        borderTopColor: '#27272a',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendSwatch: {
        width: 12,
        height: 12,
        borderRadius: 2,
    },
    removedSwatch: {
        backgroundColor: 'rgba(239, 68, 68, 0.4)',
    },
    addedSwatch: {
        backgroundColor: 'rgba(34, 197, 94, 0.4)',
    },
    legendText: {
        color: '#71717a',
        fontSize: 11,
    },
});

export default TextDiff;
