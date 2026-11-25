import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/Colors';

export const Header = ({ activeTab }) => {
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const isNarrow = width < 560;

    return (
        <View style={styles.header}>
            <View style={[styles.headerContent, isNarrow && styles.headerContentNarrow]}>
                {/* Logo */}
                <TouchableOpacity
                    style={styles.logoContainer}
                    onPress={() => navigation.navigate('Home')}
                >
                    <Image
                        source={require('../assets/ninja_header.png')}
                        style={[styles.headerLogo, isNarrow && styles.headerLogoNarrow]}
                        resizeMode="contain"
                    />
                </TouchableOpacity>

                {/* Menu Links */}
                <View style={[styles.menuContainer, isNarrow && styles.menuContainerNarrow]}>
                    <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                        <Text style={[styles.menuLink, isNarrow && styles.menuLinkNarrow, activeTab === 'student' ? styles.activeLink : styles.inactiveLink]}>
                            Student
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { if (Platform.OS === 'web' && typeof window !== 'undefined') { window.location.href = '/parent-dojo.html'; } }}>
                        <Text style={[styles.menuLink, isNarrow && styles.menuLinkNarrow, activeTab === 'parents' ? styles.activeLink : styles.inactiveLink]}>
                            Parents
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Blog')}>
                        <Text style={[styles.menuLink, isNarrow && styles.menuLinkNarrow, activeTab === 'blog' ? styles.activeLink : styles.inactiveLink]}>
                            Blog
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { if (Platform.OS === 'web' && typeof window !== 'undefined') { window.location.href = '/classrooms'; } else { navigation.navigate('ClassroomsAdmin'); } }}>
                        <Text style={[styles.menuLink, isNarrow && styles.menuLinkNarrow, activeTab === 'classrooms' ? styles.activeLink : styles.inactiveLink]}>
                            Classrooms
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        width: '100%',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 20,
    },
    headerContent: {
        width: '100%',
        maxWidth: 960,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 10,
    },
    headerContentNarrow: {
        paddingHorizontal: 12,
        gap: 8,
    },
    logoContainer: {
        // padding: 5,
    },
    headerLogo: {
        width: 170,
        height: 38,
    },
    headerLogoNarrow: {
        width: 125,
        height: 30,
    },
    menuContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 18,
    },
    menuContainerNarrow: {
        gap: 12,
    },
    menuLink: {
        fontWeight: '600',
        fontSize: 16,
    },
    menuLinkNarrow: {
        fontSize: 14,
    },
    activeLink: {
        color: Colors.primary, // Blue
    },
    inactiveLink: {
        color: '#4B5563', // Grey
    },
});
