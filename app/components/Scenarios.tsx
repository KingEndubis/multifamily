import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';

interface ScenarioInput {
  purchasePrice: string;
  downPayment: string;
  interestRate: string;
  loanTerm: string;
  rentalIncome: string;
  vacancyRate: string;
  operatingExpenses: string;
  annualAppreciation: string;
  holdingPeriod: string;
}

interface ScenarioResult {
  name: string;
  cashFlow: number;
  coc: number; // Cash on Cash Return
  irr: number; // Internal Rate of Return
  exitValue: number;
  totalProfit: number;
}

const Scenarios: React.FC = () => {
  const [scenarioName, setScenarioName] = useState('');
  const [inputs, setInputs] = useState<ScenarioInput>({
    purchasePrice: '1000000',
    downPayment: '25',
    interestRate: '5.5',
    loanTerm: '30',
    rentalIncome: '10000',
    vacancyRate: '5',
    operatingExpenses: '45',
    annualAppreciation: '3',
    holdingPeriod: '5'
  });
  const [scenarios, setScenarios] = useState<ScenarioResult[]>([]);

  const handleInputChange = (field: keyof ScenarioInput, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const calculateScenario = () => {
    // Parse inputs
    const purchasePrice = parseFloat(inputs.purchasePrice);
    const downPaymentPercent = parseFloat(inputs.downPayment) / 100;
    const downPayment = purchasePrice * downPaymentPercent;
    const loanAmount = purchasePrice - downPayment;
    const interestRate = parseFloat(inputs.interestRate) / 100;
    const loanTerm = parseInt(inputs.loanTerm);
    const monthlyInterestRate = interestRate / 12;
    const totalPayments = loanTerm * 12;
    
    // Calculate monthly mortgage payment (P&I)
    const monthlyPayment = loanAmount * 
      (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalPayments)) / 
      (Math.pow(1 + monthlyInterestRate, totalPayments) - 1);
    
    const annualDebtService = monthlyPayment * 12;
    
    // Calculate income and expenses
    const monthlyRentalIncome = parseFloat(inputs.rentalIncome);
    const annualRentalIncome = monthlyRentalIncome * 12;
    const vacancyLoss = annualRentalIncome * (parseFloat(inputs.vacancyRate) / 100);
    const effectiveGrossIncome = annualRentalIncome - vacancyLoss;
    const operatingExpenses = effectiveGrossIncome * (parseFloat(inputs.operatingExpenses) / 100);
    const netOperatingIncome = effectiveGrossIncome - operatingExpenses;
    
    // Calculate cash flow
    const annualCashFlow = netOperatingIncome - annualDebtService;
    const monthlyCashFlow = annualCashFlow / 12;
    
    // Calculate cash on cash return
    const cashOnCash = (annualCashFlow / downPayment) * 100;
    
    // Calculate future value and IRR
    const holdingPeriod = parseInt(inputs.holdingPeriod);
    const annualAppreciation = parseFloat(inputs.annualAppreciation) / 100;
    const exitValue = purchasePrice * Math.pow(1 + annualAppreciation, holdingPeriod);
    
    // Calculate remaining loan balance at exit
    let remainingBalance = loanAmount;
    for (let i = 0; i < holdingPeriod * 12; i++) {
      const interestPayment = remainingBalance * monthlyInterestRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;
    }
    
    // Calculate total profit
    const equity = exitValue - remainingBalance;
    const totalProfit = equity - downPayment + (annualCashFlow * holdingPeriod);
    
    // Simple IRR approximation (not a true IRR calculation)
    const totalReturn = totalProfit / downPayment;
    const annualizedReturn = (Math.pow(1 + totalReturn, 1 / holdingPeriod) - 1) * 100;
    
    const newScenario: ScenarioResult = {
      name: scenarioName || `Scenario ${scenarios.length + 1}`,
      cashFlow: monthlyCashFlow,
      coc: cashOnCash,
      irr: annualizedReturn,
      exitValue: exitValue,
      totalProfit: totalProfit
    };
    
    setScenarios([...scenarios, newScenario]);
    setScenarioName('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  return (
    <View className="p-4 bg-brand-100 rounded-xl my-4">
      <Text className="text-lg font-bold text-brand-800 mb-2">Investment Scenarios</Text>
      <Text className="text-brand-700 mb-4">Compare different investment strategies</Text>
      
      <View className="bg-white p-4 rounded-xl mb-4">
        <View className="mb-4">
          <Text className="text-brand-700 mb-1">Scenario Name</Text>
          <TextInput
            className="border border-brand-300 rounded-md p-2"
            value={scenarioName}
            onChangeText={setScenarioName}
            placeholder="Base Case"
          />
        </View>
        
        <View className="mb-4">
          <Text className="text-brand-700 font-medium mb-2">Property Details</Text>
          <View className="flex-row mb-2">
            <View className="flex-1 mr-2">
              <Text className="text-brand-600 mb-1">Purchase Price</Text>
              <TextInput
                className="border border-brand-300 rounded-md p-2"
                value={inputs.purchasePrice}
                onChangeText={(value) => handleInputChange('purchasePrice', value)}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Text className="text-brand-600 mb-1">Monthly Rental Income</Text>
              <TextInput
                className="border border-brand-300 rounded-md p-2"
                value={inputs.rentalIncome}
                onChangeText={(value) => handleInputChange('rentalIncome', value)}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View className="flex-row mb-2">
            <View className="flex-1 mr-2">
              <Text className="text-brand-600 mb-1">Vacancy Rate (%)</Text>
              <TextInput
                className="border border-brand-300 rounded-md p-2"
                value={inputs.vacancyRate}
                onChangeText={(value) => handleInputChange('vacancyRate', value)}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Text className="text-brand-600 mb-1">Operating Expenses (%)</Text>
              <TextInput
                className="border border-brand-300 rounded-md p-2"
                value={inputs.operatingExpenses}
                onChangeText={(value) => handleInputChange('operatingExpenses', value)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
        
        <View className="mb-4">
          <Text className="text-brand-700 font-medium mb-2">Financing</Text>
          <View className="flex-row mb-2">
            <View className="flex-1 mr-2">
              <Text className="text-brand-600 mb-1">Down Payment (%)</Text>
              <TextInput
                className="border border-brand-300 rounded-md p-2"
                value={inputs.downPayment}
                onChangeText={(value) => handleInputChange('downPayment', value)}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Text className="text-brand-600 mb-1">Interest Rate (%)</Text>
              <TextInput
                className="border border-brand-300 rounded-md p-2"
                value={inputs.interestRate}
                onChangeText={(value) => handleInputChange('interestRate', value)}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View className="flex-row">
            <View className="flex-1">
              <Text className="text-brand-600 mb-1">Loan Term (years)</Text>
              <TextInput
                className="border border-brand-300 rounded-md p-2"
                value={inputs.loanTerm}
                onChangeText={(value) => handleInputChange('loanTerm', value)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
        
        <View className="mb-4">
          <Text className="text-brand-700 font-medium mb-2">Exit Strategy</Text>
          <View className="flex-row">
            <View className="flex-1 mr-2">
              <Text className="text-brand-600 mb-1">Annual Appreciation (%)</Text>
              <TextInput
                className="border border-brand-300 rounded-md p-2"
                value={inputs.annualAppreciation}
                onChangeText={(value) => handleInputChange('annualAppreciation', value)}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Text className="text-brand-600 mb-1">Holding Period (years)</Text>
              <TextInput
                className="border border-brand-300 rounded-md p-2"
                value={inputs.holdingPeriod}
                onChangeText={(value) => handleInputChange('holdingPeriod', value)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          className="bg-brand-600 p-3 rounded-md"
          onPress={calculateScenario}
        >
          <Text className="text-white text-center font-medium">Add Scenario</Text>
        </TouchableOpacity>
      </View>
      
      {scenarios.length > 0 && (
        <View>
          <Text className="text-lg font-bold text-brand-800 mb-2">Comparison</Text>
          <ScrollView horizontal className="pb-2">
            <View>
              <View className="flex-row bg-brand-200 p-2">
                <Text className="font-medium text-brand-800 w-24">Scenario</Text>
                <Text className="font-medium text-brand-800 w-24">Monthly CF</Text>
                <Text className="font-medium text-brand-800 w-24">CoC Return</Text>
                <Text className="font-medium text-brand-800 w-24">Est. IRR</Text>
                <Text className="font-medium text-brand-800 w-24">Exit Value</Text>
                <Text className="font-medium text-brand-800 w-24">Total Profit</Text>
              </View>
              
              {scenarios.map((scenario, index) => (
                <View key={index} className="flex-row border-b border-brand-200 p-2">
                  <Text className="w-24 text-brand-700">{scenario.name}</Text>
                  <Text className="w-24 text-brand-700">{formatCurrency(scenario.cashFlow)}</Text>
                  <Text className="w-24 text-brand-700">{formatPercent(scenario.coc)}</Text>
                  <Text className="w-24 text-brand-700">{formatPercent(scenario.irr)}</Text>
                  <Text className="w-24 text-brand-700">{formatCurrency(scenario.exitValue)}</Text>
                  <Text className="w-24 text-brand-700">{formatCurrency(scenario.totalProfit)}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default Scenarios;