import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Platform, StatusBar } from 'react-native';
import * as Linking from 'expo-linking';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Analytics } from "@vercel/analytics/react";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// --- Screens ---
import { StudentHomeScreen } from './screens/StudentHomeScreen';
import { SubjectScreen } from './screens/SubjectScreen';
import { QuizScreen } from './screens/QuizScreen';
import { QuizConfigScreen } from './screens/QuizConfigScreen';
import { TestScreen } from './screens/TestScreen';
import { ComprehensionScreen } from './screens/ComprehensionScreen';
import { BlogScreen } from './screens/BlogScreen';
import { BlogPostScreen } from './screens/BlogPostScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SetupScreen } from './screens/SetupScreen';
import { initializeAuth, getProfile } from './utils/storage';

// --- Components ---
// import { AdRail } from './components/AdRail'; // Hiding Ads per request
import { InterstitialAd } from './components/InterstitialAd';
import { NotificationBanner } from './components/NotificationBanner';
import { Colors } from './constants/Colors';

// ... (imports remain)
const Stack = createStackNavigator();

export default function App() {
  // ... (state logic remains)

  // const showAds = screenW > 900; // Hiding Ads
  const showAds = false;
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      await initializeAuth();
      const profile = await getProfile();
      if (profile) {
        setIsSetupComplete(true);
      }
      setIsCheckingSetup(false);
    };
    initApp();
  }, []);

  // ... (effects remain)

  return (
    <GestureHandlerRootView style={{ flex: 1, ...Platform.select({ web: { height: '100vh', backgroundColor: '#F0F2F5' } }) }}>
      <SafeAreaProvider>
        <Analytics />
        <NotificationBanner />

        {/* Ad Rails (Web Desktop Only) - HIDDEN */}
        {/* {showAds && Platform.OS === 'web' && (
          <>
            <AdRail side="left" />
            <AdRail side="right" />
          </>
        )} */}

        {/* ... rest of app ... */}
        <InterstitialAd visible={showInterstitial} onClose={() => setShowInterstitial(false)} />

        {isCheckingSetup ? (
          <View style={styles.container}>
            <Text style={{ marginTop: 100, fontSize: 18, color: '#666' }}>Loading...</Text>
          </View>
        ) : (
          <View style={styles.webContainer}>
            {/* ... navigation container ... */}
            <NavigationContainer linking={{
              prefixes: [Linking.createURL('/'), 'https://11plusninja.com'],
              config: {
                screens: {
                  Settings: 'settings',
                  Home: '', // Default route
                  StudentDojoTest: 'test-dojo',
                  Blog: 'blog',
                  BlogPost: 'blog/:slug',
                  Dashboard: 'dashboard',
                }
              }
            }}>
              <Stack.Navigator screenOptions={{
                headerStyle: { backgroundColor: Colors.primary },
                headerTintColor: '#fff',
                headerStatusBarHeight: Platform.OS === 'android' ? StatusBar.currentHeight : undefined
              }}>
                {!isSetupComplete ? (
                  <Stack.Screen name="InitialSetup" options={{ headerShown: false }}>
                    {props => <SetupScreen {...props} onFinish={() => setIsSetupComplete(true)} />}
                  </Stack.Screen>
                ) : (
                  <>
                    <Stack.Screen name="Home" component={StudentHomeScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Subject" component={SubjectScreen} options={({ route }) => ({ title: route.params.title })} />
                    <Stack.Screen name="Quiz" component={QuizScreen} />
                    <Stack.Screen name="QuizConfig" component={QuizConfigScreen} options={{ title: "Setup Quiz" }} />
                    <Stack.Screen name="Test" component={TestScreen} options={{ title: "Maths Test" }} />
                    <Stack.Screen name="Comprehension" component={ComprehensionScreen} options={{ title: "English Comprehension" }} />
                    <Stack.Screen name="Blog" component={BlogScreen} options={{ title: "Ninja Blog", headerShown: false }} />
                    <Stack.Screen name="BlogPost" component={BlogPostScreen} options={{ title: "Article", headerBackTitle: "Blog", headerShown: false }} />
                    <Stack.Screen name="Dashboard" component={DashboardScreen} />
                    <Stack.Screen name="Settings" component={SettingsScreen} />
                    <Stack.Screen name="Setup" component={SetupScreen} options={{ headerShown: false }} />
                  </>
                )}
              </Stack.Navigator>
            </NavigationContainer>

            {/* Dev Trigger for Interstitial */}
            {!showAds && <TouchableOpacity
              style={{ position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 5 }}
              onPress={() => setShowInterstitial(true)}
            >
              <Text style={{ color: '#fff', fontSize: 10 }}>Ad Test</Text>
            </TouchableOpacity>}
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// --- Styles ---
const isLargeScreen = Dimensions.get('window').width > 600;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'flex-start',
    ...Platform.select({
      web: { minHeight: '100vh' }
    })
  },
  // Wrapper for Web/Desktop/Tablet to simulate mobile view
  webContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480, // RESIZED to 480px per requirements
    backgroundColor: '#fff',
    alignSelf: 'center',
    ...Platform.select({
      web: {
        minHeight: '100%',
        boxShadow: '0px 0px 30px rgba(0,0,0,0.2)', // Stronger shadow
        marginHorizontal: 'auto',
        paddingBottom: 20
      },
      android: {
        elevation: isLargeScreen ? 5 : 0
      }
    })
  },
});
