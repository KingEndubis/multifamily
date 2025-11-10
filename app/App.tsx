import { StatusBar } from 'expo-status-bar';
import { View, Text, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeWindProvider } from './NativeWindProvider';
import { PuterProvider } from './services/PuterProvider';
import './global.css';
import MulfaChatBar from './components/MulfaChatBar';
import MarketAnalysis from './components/MarketAnalysis';

const Stack = createNativeStackNavigator();

function HomeScreen() {
  // Minimalist Grok-like home: full-screen white canvas with a bottom-centered chat bar.
  return (
    <View className="flex-1 bg-white">
      <MulfaChatBar />
      <StatusBar style="dark" />
    </View>
  );
}

function NewDealScreen() {
  return (
    <View className="flex-1 bg-white p-6">
      <Text className="heading mb-4">Property Basics</Text>
      <Text className="subheading">Units, rent, expenses, purchase price</Text>
    </View>
  );
}

function MarketScreen() {
  return (
    <ScrollView className="flex-1 bg-brand-50 p-6">
      <Text className="heading mb-4">Market Analysis</Text>
      <Text className="subheading">Emerging market signals, rent comps, job growth</Text>
      <MarketAnalysis />
    </ScrollView>
  );
}

export default function App() {
  return (
    <PuterProvider>
      <NativeWindProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="NewDeal" component={NewDealScreen} options={{ title: 'New Deal' }} />
            <Stack.Screen name="Market" component={MarketScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </NativeWindProvider>
    </PuterProvider>
  );
}
