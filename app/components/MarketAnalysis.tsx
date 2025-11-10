import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';

interface MarketData {
  city: string;
  state: string;
  population: number;
  populationGrowth: number;
  jobGrowth: number;
  medianRent: number;
  rentGrowth: number;
  capRate: number;
}

const sampleMarkets: MarketData[] = [
  {
    city: 'Austin',
    state: 'TX',
    population: 2227083,
    populationGrowth: 3.4,
    jobGrowth: 4.5,
    medianRent: 1548,
    rentGrowth: 5.2,
    capRate: 4.9
  },
  {
    city: 'Nashville',
    state: 'TN',
    population: 1989519,
    populationGrowth: 2.8,
    jobGrowth: 3.9,
    medianRent: 1462,
    rentGrowth: 4.7,
    capRate: 5.2
  },
  {
    city: 'Raleigh',
    state: 'NC',
    population: 1390785,
    populationGrowth: 3.1,
    jobGrowth: 3.7,
    medianRent: 1397,
    rentGrowth: 4.5,
    capRate: 5.0
  }
];

const MarketAnalysis: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<MarketData | null>(null);
  const [showAllMarkets, setShowAllMarkets] = useState(true);

  const filteredMarkets = searchTerm
    ? sampleMarkets.filter(market => 
        market.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        market.state.toLowerCase().includes(searchTerm.toLowerCase()))
    : sampleMarkets;

  const handleSelectMarket = (market: MarketData) => {
    setSelectedMarket(market);
    setShowAllMarkets(false);
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;
  
  const renderMarketCard = (market: MarketData) => (
    <TouchableOpacity 
      key={`${market.city}-${market.state}`}
      className="p-4 bg-white rounded-xl mb-4 border border-brand-200"
      onPress={() => handleSelectMarket(market)}
    >
      <Text className="text-lg font-bold text-brand-800">{market.city}, {market.state}</Text>
      <View className="flex-row justify-between mt-2">
        <View>
          <Text className="text-brand-600">Job Growth</Text>
          <Text className="font-medium">{formatPercent(market.jobGrowth)}</Text>
        </View>
        <View>
          <Text className="text-brand-600">Rent Growth</Text>
          <Text className="font-medium">{formatPercent(market.rentGrowth)}</Text>
        </View>
        <View>
          <Text className="text-brand-600">Cap Rate</Text>
          <Text className="font-medium">{formatPercent(market.capRate)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="p-4 bg-brand-100 rounded-xl my-4">
      <Text className="text-lg font-bold text-brand-800 mb-2">Market Analysis</Text>
      <Text className="text-brand-700 mb-4">Analyze emerging markets using RE Mentor criteria</Text>
      
      <View className="mb-4">
        <TextInput
          className="border border-brand-300 rounded-md p-2 bg-white"
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search markets by city or state"
        />
      </View>
      
      <ScrollView className="max-h-96">
        {filteredMarkets.map(renderMarketCard)}
      </ScrollView>
    </View>
  );
};

export default MarketAnalysis;