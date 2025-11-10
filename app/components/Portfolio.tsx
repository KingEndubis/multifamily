import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface Property {
  id: string;
  name: string;
  address: string;
  units: number;
  purchasePrice: number;
  currentValue: number;
  monthlyCashFlow: number;
  capRate: number;
}

const sampleProperties = [
  {
    id: '1',
    name: 'Oakwood Apartments',
    address: '123 Main St, Austin, TX',
    units: 24,
    purchasePrice: 2400000,
    currentValue: 2750000,
    monthlyCashFlow: 6500,
    capRate: 7.2
  },
  {
    id: '2',
    name: 'Riverside Complex',
    address: '456 River Rd, Nashville, TN',
    units: 16,
    purchasePrice: 1800000,
    currentValue: 1950000,
    monthlyCashFlow: 4200,
    capRate: 6.8
  }
];

const Portfolio: React.FC = () => {
  const [properties] = useState(sampleProperties);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;
  
  // Calculate portfolio totals
  const totalProperties = properties.length;
  const totalUnits = properties.reduce((sum, property) => sum + property.units, 0);
  const totalValue = properties.reduce((sum, property) => sum + property.currentValue, 0);
  const totalMonthlyCashFlow = properties.reduce((sum, property) => sum + property.monthlyCashFlow, 0);
  
  return (
    <View className="p-4 bg-brand-100 rounded-xl my-4">
      <Text className="text-lg font-bold text-brand-800 mb-2">Portfolio Overview</Text>
      
      <View className="bg-white p-4 rounded-xl mb-4">
        <Text className="text-brand-700 font-medium mb-2">Portfolio Summary</Text>
        <View className="flex-row justify-between mb-2">
          <View>
            <Text className="text-brand-600">Properties</Text>
            <Text className="font-medium">{totalProperties}</Text>
          </View>
          <View>
            <Text className="text-brand-600">Total Units</Text>
            <Text className="font-medium">{totalUnits}</Text>
          </View>
          <View>
            <Text className="text-brand-600">Portfolio Value</Text>
            <Text className="font-medium">{formatCurrency(totalValue)}</Text>
          </View>
        </View>
        <View className="flex-row justify-between">
          <View>
            <Text className="text-brand-600">Monthly Cash Flow</Text>
            <Text className="font-medium">{formatCurrency(totalMonthlyCashFlow)}</Text>
          </View>
          <View>
            <Text className="text-brand-600">Annual Cash Flow</Text>
            <Text className="font-medium">{formatCurrency(totalMonthlyCashFlow * 12)}</Text>
          </View>
        </View>
      </View>
      
      <ScrollView className="max-h-96">
        {properties.map(property => (
          <View 
            key={property.id}
            className="p-4 bg-white rounded-xl mb-4 border border-brand-200"
          >
            <Text className="text-lg font-bold text-brand-800">{property.name}</Text>
            <Text className="text-brand-600 mb-2">{property.address}</Text>
            
            <View className="flex-row justify-between mt-2">
              <View>
                <Text className="text-brand-600">Units</Text>
                <Text className="font-medium">{property.units}</Text>
              </View>
              <View>
                <Text className="text-brand-600">Current Value</Text>
                <Text className="font-medium">{formatCurrency(property.currentValue)}</Text>
              </View>
              <View>
                <Text className="text-brand-600">Monthly CF</Text>
                <Text className="font-medium">{formatCurrency(property.monthlyCashFlow)}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default Portfolio;