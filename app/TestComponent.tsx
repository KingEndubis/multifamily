import React from 'react';
import { View, Text } from 'react-native';

export function TestComponent() {
  return (
    <View className="p-4 bg-brand-600 rounded-xl m-4">
      <Text className="text-white font-bold text-lg">Test Component</Text>
      <Text className="text-white">This tests if NativeWind styles are working</Text>
    </View>
  );
}