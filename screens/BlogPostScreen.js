import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BLOG_POSTS } from '../data/blogPosts';
import { Header } from '../components/Header';
import { getRandomQuiz, getQuiz } from '../utils/quickQuizGenerator';
import { fetchEnglishQuiz } from '../utils/englishLoader';

import { Colors as BaseColors } from '../constants/Colors';

const Colors = {
    ...BaseColors,
    primary: '#2563EB', // Ninja Blue
    secondary: '#F59E0B', // Gold
    dark: '#1F2937', // Black Belt
    background: '#FFFFFF', // Override background to white
};

export const BlogPostScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { slug } = route.params;

    const post = BLOG_POSTS.find(p => p.slug === slug);
    const scrollY = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef(null);
    const [contentHeight, setContentHeight] = useState(1);
    const [containerHeight, setContainerHeight] = useState(1);
    const [isLoadingEnglish, setIsLoadingEnglish] = useState(false);

    // Dynamic SEO Metadata
    React.useEffect(() => {
        if (post) {
            if (Platform.OS === 'web') {
                document.title = `${post.title} | 11+ Ninja`;

                // Update meta description
                let metaDescription = document.querySelector('meta[name="description"]');
                if (!metaDescription) {
                    metaDescription = document.createElement('meta');
                    metaDescription.name = "description";
                    document.head.appendChild(metaDescription);
                }
                metaDescription.content = post.subtitle || "Expert 11+ advice from 11PlusNinja.";
            }
        }
    }, [post]);

    if (!post) {
        return (
            <View style={styles.centerContainer}>
                <Text>Post not found.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Calculate generic progress based on scroll
    const progress = scrollY.interpolate({
        inputRange: [0, Math.max(contentHeight - containerHeight, 1)],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
    });

    const renderContentBlock = (block, index) => {
        switch (block.type) {
            case 'header':
                return <Text key={index} style={styles.h2}>{block.value}</Text>;
            case 'subheader':
                return <Text key={index} style={styles.h3}>{block.value}</Text>;
            case 'paragraph':
                return <Text key={index} style={styles.p}>{block.value}</Text>;
            case 'list':
                return (
                    <View key={index} style={styles.listContainer}>
                        {block.items.map((item, i) => (
                            <View key={i} style={styles.listItem}>
                                <Text style={styles.bullet}>•</Text>
                                {/* Simple HTML parsing for bold tags if needed, or just Text */}
                                {item.includes('<strong>') ? (
                                    <Text style={styles.listText}>
                                        <Text style={{ fontWeight: 'bold' }}>{item.replace(/<\/?strong>/g, '').split(':')[0]}:</Text>
                                        {item.replace(/<\/?strong>/g, '').split(':')[1]}
                                    </Text>
                                ) : (
                                    <Text style={styles.listText}>{item}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                );
            case 'callout':
                return (
                    <View key={index} style={styles.calloutBox}>
                        <Text style={styles.calloutTitle}>💡 {block.title}</Text>
                        <Text style={styles.calloutValue}>
                            {/* Simple HTML cleaning */}
                            {block.value.replace(/<\/?em>/g, '')}
                        </Text>
                    </View>
                );
            case 'table':
                return (
                    <View key={index} style={styles.tableContainer}>
                        <View style={styles.tableRowHeader}>
                            {block.headers.map((h, i) => <Text key={i} style={[styles.tableHeader, { flex: 1 }]}>{h}</Text>)}
                        </View>
                        {block.rows.map((row, rIndex) => (
                            <View key={rIndex} style={styles.tableRow}>
                                {row.map((cell, cIndex) => (
                                    <Text key={cIndex} style={[styles.tableCell, { flex: 1 }]}>{cell}</Text>
                                ))}
                            </View>
                        ))}
                    </View>
                );
            case 'link':
                return (
                    <TouchableOpacity key={index} onPress={() => navigation.push('BlogPost', { slug: block.url })} style={styles.internalLink}>
                        <Text style={styles.internalLinkText}>{block.text} →</Text>
                    </TouchableOpacity>
                );
            case 'cta':
                return (
                    <TouchableOpacity
                        key={index}
                        style={[styles.ctaBox, block.action === 'QuickStart' && isLoadingEnglish && { opacity: 0.6 }]}
                        disabled={block.action === 'QuickStart' && isLoadingEnglish}
                        onPress={async () => {
                            if (block.action === 'StudentDojoTest') {
                                // Fallback just in case
                                navigation.navigate('Test');
                            } else if (block.action === 'QuickStart') {
                                let quizConfig = getRandomQuiz();
                                if (quizConfig.config.subject === 'English') {
                                    try {
                                        setIsLoadingEnglish(true);
                                        const data = await fetchEnglishQuiz();
                                        setIsLoadingEnglish(false);
                                        navigation.navigate('Comprehension', data);
                                    } catch (err) {
                                        setIsLoadingEnglish(false);
                                        alert("Error: Could not load quiz: " + err.message);
                                    }
                                } else {
                                    navigation.navigate('Quiz', quizConfig);
                                }
                            } else if (block.action === 'NvrSprint') {
                                let quizConfig = getQuiz('Non-Verbal', 'Matrices');
                                navigation.navigate('Quiz', quizConfig);
                            } else if (block.action === 'MathsSpeed') {
                                let quizConfig = getQuiz('Maths', 'General');
                                navigation.navigate('Quiz', quizConfig);
                            } else {
                                console.log('Action:', block.action);
                            }
                        }}
                    >
                        <Text style={styles.ctaText}>{block.text}</Text>
                        <View style={styles.ctaButton}>
                            <Text style={styles.ctaButtonText}>
                                {(block.action === 'QuickStart' && isLoadingEnglish) ? 'Loading...' : block.buttonLabel}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <Header activeTab="blog" />


            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
                <Animated.View style={[styles.progressBar, { width: progress }]} />
            </View>

            <Animated.ScrollView
                ref={scrollViewRef}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                onContentSizeChange={(w, h) => setContentHeight(h)}
                onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.articleHeader}>
                    <Text style={styles.category}>{post.category}</Text>
                    <Text style={styles.title}>{post.title}</Text>
                    <Text style={styles.subtitle}>{post.subtitle}</Text>
                    <View style={styles.metaContainer}>
                        <Text style={styles.metaText}>{post.author} • {post.date} • {post.readTime}</Text>
                    </View>
                </View>

                <View style={styles.articleBody}>
                    {post.content.map(renderContentBlock)}
                </View>

                <View style={styles.articleFooter}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
                        <Text style={styles.backLinkText}>← Back to Blog</Text>
                    </TouchableOpacity>
                </View>
            </Animated.ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressBarContainer: {
        height: 4,
        width: '100%',
        backgroundColor: '#E5E7EB',
        // Removed absolute positioning to sit below header
    },
    progressBar: {
        height: '100%',
        backgroundColor: Colors.alertRed,
    },
    scrollContent: {
        paddingBottom: 80,
    },
    articleHeader: {
        padding: 24,
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        alignItems: 'center',
    },
    category: {
        color: Colors.primary,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        fontSize: 12,
    },
    title: {
        fontSize: 28, // Mobile-optimized
        fontWeight: '800',
        color: Colors.dark,
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 36,
        maxWidth: 800,
    },
    subtitle: {
        fontSize: 18,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 28,
        maxWidth: 600,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    articleBody: {
        padding: 24,
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },
    h2: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.dark,
        marginTop: 32,
        marginBottom: 16,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.dark,
        marginTop: 24,
        marginBottom: 12,
    },
    p: {
        fontSize: 18,
        lineHeight: 28,
        color: Colors.text,
        marginBottom: 16,
    },
    listContainer: {
        marginBottom: 16,
        paddingLeft: 8,
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    bullet: {
        fontSize: 18,
        color: Colors.primary,
        marginRight: 8,
        lineHeight: 28,
    },
    listText: {
        fontSize: 18,
        lineHeight: 28,
        color: Colors.text,
        flex: 1,
    },
    ctaBox: {
        backgroundColor: '#ECFDF5', // Light green bg
        borderWidth: 2,
        borderColor: Colors.actionGreen,
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        marginVertical: 32,
    },
    ctaText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#065F46', // Dark green text
        textAlign: 'center',
        marginBottom: 16,
    },
    ctaButton: {
        backgroundColor: Colors.actionGreen,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    ctaButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    articleFooter: {
        padding: 24,
        alignItems: 'center',
    },
    backLink: {
        padding: 12,
    },
    backLinkText: {
        color: Colors.primary,
        fontWeight: '600',
        fontSize: 16,
    },
    backButton: {
        padding: 10,
        backgroundColor: Colors.primary,
        borderRadius: 5,
        marginTop: 10,
    },
    backButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    calloutBox: {
        backgroundColor: '#FEF3C7', // Amber 100
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
        padding: 16,
        borderRadius: 8,
        marginVertical: 24,
    },
    calloutTitle: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#92400E',
        marginBottom: 8,
    },
    calloutValue: {
        fontSize: 16,
        color: '#78350F',
        lineHeight: 24,
    },
    tableContainer: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        overflow: 'hidden',
        marginVertical: 24,
    },
    tableRowHeader: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tableHeader: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#374151',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
    },
    tableCell: {
        fontSize: 14,
        color: '#4B5563',
    },
    internalLink: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    internalLinkText: {
        color: Colors.primary,
        fontWeight: 'bold',
        fontSize: 18,
        textDecorationLine: 'underline',
    }

});
