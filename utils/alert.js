import { Alert, Platform } from 'react-native';

export const showAlert = (title, message = '') => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(message ? `${title}\n\n${message}` : title);
        return;
    }
    Alert.alert(title, message);
};

export const showConfirm = (title, message, onConfirm, confirmText = 'OK') => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const confirmed = window.confirm(message ? `${title}\n\n${message}` : title);
        if (confirmed && onConfirm) {
            onConfirm();
        }
        return;
    }
    Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: confirmText, onPress: onConfirm },
    ]);
};
