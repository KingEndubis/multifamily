import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';

interface CalculationResult {
  noi: number;
  capRate: number;
  cashOnCash: number;
  dscr: number;
  cashFlow: number;
}

const PropertyCalculator: React.FC = () => {
  // Property inputs
  const [purchasePrice, setPurchasePrice] = useState('');
  const [grossRent, setGrossRent] = useState('');
  const [vacancyRate, setVacancyRate] = useState('5'); // Default 5%
  const [operatingExpenses, setOperatingExpenses] = useState('');
  
  // Financing inputs
  const [downPayment, setDownPayment] = useState('25'); // Default 25%
  const [interestRate, setInterestRate] = useState('6.5'); // Default 6.5%
  const [loanTerm, setLoanTerm] = useState('30'); // Default 30 years
  const [closingCosts, setClosingCosts] = useState('3'); // Default 3% of purchase price
  
  // Results
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateMetrics = () => {
    setError(null);
    
    // Validate inputs
    if (!purchasePrice || !grossRent || !operatingExpenses) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      // Parse inputs
      const price = parseFloat(purchasePrice);
      const rent = parseFloat(grossRent);
      const vacancy = parseFloat(vacancyRate) / 100;
      const expenses = parseFloat(operatingExpenses);
      const down = parseFloat(downPayment) / 100;
      const interest = parseFloat(interestRate) / 100;
      const term = parseFloat(loanTerm);
      const closing = parseFloat(closingCosts) / 100;
      
      // Calculate effective gross income
      const effectiveGrossIncome = rent * (1 - vacancy);
      
      // Calculate NOI
      const noi = effectiveGrossIncome - expenses;
      
      // Calculate cap rate
      const capRate = (noi / price) * 100;
      
      // Calculate loan amount and payments
      const loanAmount = price * (1 - down);
      const monthlyInterest = interest / 12;
      const payments = term * 12;
      const monthlyPayment = loanAmount * (monthlyInterest * Math.pow(1 + monthlyInterest, payments)) / 
                           (Math.pow(1 + monthlyInterest, payments) - 1);
      const annualDebtService = monthlyPayment * 12;
      
      // Calculate DSCR
      const dscr = noi / annualDebtService;
      
      // Calculate cash flow
      const cashFlow = noi - annualDebtService;
      
      // Calculate cash on cash return
      const totalInvestment = (price * down) + (price * closing);
      const cashOnCash = (cashFlow / totalInvestment) * 100;
      
      // Set results
      setResult({
        noi,
        capRate,
        cashOnCash,
        dscr,
        cashFlow
      });
    } catch (e) {
      setError('Error in calculations. Please check your inputs.');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatRatio = (value: number) => {
    return value.toFixed(2);
  };

  return (
    <View className="p-4 bg-brand-100 rounded-xl my-4">
      <Text className="text-lg font-bold text-brand-800 mb-2">Property Calculator</Text>
      <Text className="text-brand-700 mb-4">Calculate key investment metrics</Text>
      
      <View className="mb-4">
        <Text className="font-medium mb-1">Purchase Price:</Text>
        <TextInput
          className="border border-brand-300 rounded-md p-2 bg-white"
          value={purchasePrice}
          onChangeText={setPurchasePrice}
          placeholder="e.g. 1000000"
          keyboardType="numeric"
        />
      </View>
      
      <View className="mb-4">
        <Text className="font-medium mb-1">Annual Gross Rent:</Text>
        <TextInput
          className="border border-brand-300 rounded-md p-2 bg-white"
          value={grossRent}
          onChangeText={setGrossRent}
          placeholder="e.g. 120000"
          keyboardType="numeric"
        />
      </View>
      
      <View className="flex-row mb-4">
        <View className="flex-1 mr-2">
          <Text className="font-medium mb-1">Vacancy Rate (%):</Text>
          <TextInput
            className="border border-brand-300 rounded-md p-2 bg-white"
            value={vacancyRate}
            onChangeText={setVacancyRate}
            placeholder="e.g. 5"
            keyboardType="numeric"
          />
        </View>
        
        <View className="flex-1 ml-2">
          <Text className="font-medium mb-1">Annual Operating Expenses:</Text>
          <TextInput
            className="border border-brand-300 rounded-md p-2 bg-white"
            value={operatingExpenses}
            onChangeText={setOperatingExpenses}
            placeholder="e.g. 40000"
            keyboardType="numeric"
          />
        </View>
      </View>
      
      <Text className="text-lg font-bold text-brand-800 mt-2 mb-2">Financing</Text>
      
      <View className="flex-row mb-4">
        <View className="flex-1 mr-2">
          <Text className="font-medium mb-1">Down Payment (%):</Text>
          <TextInput
            className="border border-brand-300 rounded-md p-2 bg-white"
            value={downPayment}
            onChangeText={setDownPayment}
            placeholder="e.g. 25"
            keyboardType="numeric"
          />
        </View>
        
        <View className="flex-1 ml-2">
          <Text className="font-medium mb-1">Interest Rate (%):</Text>
          <TextInput
            className="border border-brand-300 rounded-md p-2 bg-white"
            value={interestRate}
            onChangeText={setInterestRate}
            placeholder="e.g. 6.5"
            keyboardType="numeric"
          />
        </View>
      </View>
      
      <View className="flex-row mb-4">
        <View className="flex-1 mr-2">
          <Text className="font-medium mb-1">Loan Term (years):</Text>
          <TextInput
            className="border border-brand-300 rounded-md p-2 bg-white"
            value={loanTerm}
            onChangeText={setLoanTerm}
            placeholder="e.g. 30"
            keyboardType="numeric"
          />
        </View>
        
        <View className="flex-1 ml-2">
          <Text className="font-medium mb-1">Closing Costs (%):</Text>
          <TextInput
            className="border border-brand-300 rounded-md p-2 bg-white"
            value={closingCosts}
            onChangeText={setClosingCosts}
            placeholder="e.g. 3"
            keyboardType="numeric"
          />
        </View>
      </View>
      
      <TouchableOpacity 
        className="bg-brand-600 py-3 px-4 rounded-md items-center mb-4"
        onPress={calculateMetrics}
      >
        <Text className="text-white font-medium">Calculate</Text>
      </TouchableOpacity>
      
      {error && (
        <View className="bg-red-100 p-2 rounded-md mb-4">
          <Text className="text-red-700">{error}</Text>
        </View>
      )}
      
      {result && (
        <View className="bg-white p-4 rounded-md border border-brand-200">
          <Text className="text-lg font-bold text-brand-800 mb-2">Results</Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className="font-medium">NOI:</Text>
            <Text className="text-brand-700">{formatCurrency(result.noi)}/year</Text>
          </View>
          
          <View className="flex-row justify-between mb-2">
            <Text className="font-medium">Cap Rate:</Text>
            <Text className="text-brand-700">{formatPercent(result.capRate)}</Text>
          </View>
          
          <View className="flex-row justify-between mb-2">
            <Text className="font-medium">Cash-on-Cash Return:</Text>
            <Text className="text-brand-700">{formatPercent(result.cashOnCash)}</Text>
          </View>
          
          <View className="flex-row justify-between mb-2">
            <Text className="font-medium">DSCR:</Text>
            <Text className="text-brand-700">{formatRatio(result.dscr)}</Text>
          </View>
          
          <View className="flex-row justify-between mb-2">
            <Text className="font-medium">Annual Cash Flow:</Text>
            <Text className={`${result.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'} font-bold`}>
              {formatCurrency(result.cashFlow)}/year
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default PropertyCalculator;