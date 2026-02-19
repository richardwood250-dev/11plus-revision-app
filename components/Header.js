import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/Colors';

export const Header = ({ activeTab }) => {
    const navigation = useNavigation();

    return (
        <View style={styles.header}>
            <View style={styles.headerContent}>
                {/* Logo */}
                <TouchableOpacity
                    style={styles.logoContainer}
                    onPress={() => window.location.href = '/'}
                >
                    <Image
                        source={{ uri: '/assets/ninja_header.png' }}
                        style={styles.headerLogo}
                        resizeMode="contain"
                    />
                </TouchableOpacity>

                {/* Menu Links */}
                <View style={styles.menuContainer}>
                    <TouchableOpacity onPress={() => window.location.href = '/'}>
                        <Text style={[styles.menuLink, activeTab === 'student' ? styles.activeLink : styles.inactiveLink]}>
                            Student
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => window.location.href = '/parent-dojo.html'}>
                        <Text style={[styles.menuLink, activeTab === 'parents' ? styles.activeLink : styles.inactiveLink]}>
                            Parents
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Blog')}>
                        <Text style={[styles.menuLink, activeTab === 'blog' ? styles.activeLink : styles.inactiveLink]}>
                            Blog
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
        paddingVertical: 15,
        alignItems: 'center',
        marginBottom: 20,
    },
    headerContent: {
        width: '100%',
        maxWidth: 800,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    logoContainer: {
        // padding: 5,
    },
    headerLogo: {
        width: 180,
        height: 40,
    },
    menuContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    menuLink: {
        fontWeight: '600',
        fontSize: 16,
    },
    activeLink: {
        color: Colors.primary, // Blue
    },
    inactiveLink: {
        color: '#4B5563', // Grey
    },
});
