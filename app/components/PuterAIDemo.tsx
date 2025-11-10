import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, ScrollView } from 'react-native';
import { usePuterContext } from '../services/PuterProvider';
import { useMulfaSubagent } from '../prompt-agent';
import { useKnowledgeBase } from '../services/knowledge-service';

const PuterAIDemo: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedConcepts, setUsedConcepts] = useState<string[]>([]);
  const [showKnowledgeSource, setShowKnowledgeSource] = useState(false);
  
  const { formatPrompt, lastUpdated } = useMulfaSubagent();
  const { searchConcepts, isLoading: isKnowledgeLoading } = useKnowledgeBase();
  
  const { 
    isLoaded, 
    isAuthenticated, 
    chatWithAI,
    generateImage,
    signIn 
  } = usePuterContext();

  const handleChat = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    setResponse('');
    setUsedConcepts([]);
    
    try {
      if (!isAuthenticated) {
        await signIn();
      }
      
      // Find relevant concepts for this prompt
      const relevantConcepts = !isKnowledgeLoading ? searchConcepts(prompt) : [];
      const conceptTitles = relevantConcepts.slice(0, 2).map(c => c.title);
      setUsedConcepts(conceptTitles);
      
      // Format prompt with system instructions and knowledge context
      const formattedPrompt = formatPrompt(prompt);
      
      // Send to AI
      const result = await chatWithAI(formattedPrompt);
      setResponse(result.response || 'No response received');
    } catch (e: any) {
      setError(e.message || 'Failed to chat with AI');
    } finally {
      setLoading(false);
    }
  };

  const handleImageGeneration = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    setImageUrl('');
    setUsedConcepts([]);
    
    try {
      if (!isAuthenticated) {
        await signIn();
      }
      
      // Find relevant concepts for this prompt
      const relevantConcepts = !isKnowledgeLoading ? searchConcepts(prompt) : [];
      const conceptTitles = relevantConcepts.slice(0, 2).map(c => c.title);
      setUsedConcepts(conceptTitles);
      
      // Format prompt with system instructions and knowledge context
      const formattedPrompt = formatPrompt(prompt);
      
      const result = await generateImage(formattedPrompt, true); // Using test mode
      if (result && result.url) {
        setImageUrl(result.url);
      } else {
        setError('No image URL received');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <View className="p-4 bg-brand-100 rounded-xl my-4">
        <Text className="text-brand-800 font-medium">Loading Puter.js...</Text>
      </View>
    );
  }

  return (
    <View className="p-4 bg-brand-100 rounded-xl my-4">
      <Text className="text-lg font-bold text-brand-800 mb-2">AI Assistant</Text>
      <Text className="text-brand-700 mb-4">Ask questions about multifamily real estate investing</Text>
      
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="font-medium">Your Question:</Text>
          <TouchableOpacity onPress={() => setShowKnowledgeSource(!showKnowledgeSource)}>
            <Text className="text-brand-600 text-sm">
              {showKnowledgeSource ? 'Hide Knowledge Source' : 'Show Knowledge Source'}
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          className="border border-brand-300 rounded-md p-2 bg-white h-24"
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Ask about cap rates, NOI, emerging markets..."
          multiline
        />
        
        {showKnowledgeSource && (
          <View className="mt-2 p-2 bg-brand-50 rounded-md">
            <Text className="text-xs text-brand-600 font-medium">Knowledge Updated: {new Date(lastUpdated).toLocaleString()}</Text>
            <Text className="text-xs text-brand-500 mt-1">
              {isKnowledgeLoading 
                ? 'Loading knowledge base...' 
                : 'Mulfa will use relevant knowledge from Dave Lindahl\'s books without verbatim copying.'}
            </Text>
          </View>
        )}
      </View>
      
      <View className="flex-row justify-between mb-4">
        <TouchableOpacity 
          className="bg-brand-600 py-2 px-4 rounded-md flex-1 mr-2 items-center"
          onPress={handleChat}
          disabled={loading || !prompt.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-medium">Ask AI</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="bg-brand-800 py-2 px-4 rounded-md flex-1 ml-2 items-center"
          onPress={handleImageGeneration}
          disabled={loading || !prompt.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-medium">Generate Image</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {error && (
        <View className="bg-red-100 p-2 rounded-md mb-2">
          <Text className="text-red-700">{error}</Text>
        </View>
      )}
      
      {response && (
        <View className="mt-2">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="font-medium">AI Response:</Text>
            {usedConcepts.length > 0 && (
              <View className="flex-row flex-wrap">
                {usedConcepts.map((concept, idx) => (
                  <View key={idx} className="bg-brand-100 px-2 py-1 rounded-full mr-1 mb-1">
                    <Text className="text-xs text-brand-700">{concept}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <ScrollView className="bg-white p-3 rounded-md border border-brand-200 max-h-80">
            <Text className="text-brand-700">{response}</Text>
          </ScrollView>
        </View>
      )}
      
      {imageUrl && (
        <View className="mt-4">
          <Text className="font-medium mb-1">Generated Image:</Text>
          <View className="bg-white p-2 rounded-md border border-brand-200 items-center">
            <Image 
              source={{ uri: imageUrl }} 
              className="w-full h-48 rounded-md"
              resizeMode="contain"
            />
          </View>
        </View>
      )}
    </View>
  );
};

export default PuterAIDemo;