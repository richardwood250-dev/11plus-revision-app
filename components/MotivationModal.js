import React from 'react';
import { Modal, View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

const MotivationModal = ({ visible, onClose, data }) => {
    if (!data) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Image
                        source={require('../assets/ninja_header.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />

                    <Text style={styles.title}>New Record! 🏆</Text>

                    <Text style={styles.message}>
                        {data.message}
                    </Text>

                    <Text style={styles.statBox}>
                        {data.type === 'time' ? '⏱️' : '🎯'} {data.value}
                    </Text>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={onClose}
                    >
                        <Text style={styles.textStyle}>Keep it up!</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '85%'
    },
    logo: {
        width: 200,
        height: 60,
        marginBottom: 20
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFD700', // Gold
        marginBottom: 15,
        textAlign: 'center'
    },
    message: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
        color: '#333'
    },
    statBox: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4DA6FF', // Ninja Blue
        marginBottom: 30
    },
    button: {
        borderRadius: 30,
        padding: 15,
        elevation: 2,
        backgroundColor: "#4DA6FF",
        paddingHorizontal: 40
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
        fontSize: 16
    }
});

export default MotivationModal;
