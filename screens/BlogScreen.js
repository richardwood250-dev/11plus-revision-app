import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Image, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Helmet } from 'react-helmet-async';
import { BLOG_POSTS } from '../data/blogPosts';
import { Header } from '../components/Header';

import { Colors as BaseColors } from '../constants/Colors';

const Colors = {
    ...BaseColors,
    primary: '#2563EB', // Ninja Blue
    secondary: '#F59E0B', // Gold
    dark: '#1F2937', // Black Belt
};

const BlogPostCard = ({ post, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
        <View style={styles.cardContent}>
            <Text style={styles.categoryBadge}>{post.category}</Text>
            <Text style={styles.cardTitle}>{post.title}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={2}>{post.subtitle}</Text>
            <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>{post.date} • {post.readTime}</Text>
                <Text style={styles.readMore}>Read →</Text>
            </View>
        </View>
    </TouchableOpacity>
);

export const BlogScreen = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <Helmet>
                <title>Parent Blog | 11+ Ninja</title>
                <meta name="description" content="Expert 11+ guides, resources, and advice for parents preparing their children for Grammar School entrance exams." />
                <meta property="og:title" content="Parent Blog | 11+ Ninja" />
                <meta property="og:description" content="Expert 11+ guides, resources, and advice for parents preparing their children for Grammar School entrance exams." />
                <meta property="og:url" content="https://11plusninja.com/blog" />
            </Helmet>
            <Header activeTab="blog" />

            <FlatList
                data={BLOG_POSTS}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <BlogPostCard
                        post={item}
                        onPress={() => navigation.navigate('BlogPost', { slug: item.slug })}
                    />
                )}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        padding: 24,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.dark,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    listContent: {
        padding: 16,
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
        borderLeftWidth: 4,
        borderLeftColor: Colors.secondary,
    },
    cardContent: {
        padding: 20,
    },
    categoryBadge: {
        backgroundColor: '#EFF6FF',
        color: Colors.primary,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 12,
        overflow: 'hidden',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark,
        marginBottom: 8,
        lineHeight: 28,
    },
    cardSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 16,
        lineHeight: 24,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 16,
    },
    cardMeta: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    readMore: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
    },
    logoContainer: {
        marginBottom: 10,
    },
    headerLogo: {
        width: 200,
        height: 50,
    },
});
