import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { usePuterContext } from '../services/PuterProvider';

const PuterStorageDemo: React.FC = () => {
  const [fileName, setFileName] = useState('deal-data.json');
  const [fileContent, setFileContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { 
    isLoaded, 
    isAuthenticated, 
    saveFile, 
    readFile, 
    signIn 
  } = usePuterContext();

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!isAuthenticated) {
        await signIn();
      }
      
      const data = {
        timestamp: new Date().toISOString(),
        content: fileContent
      };
      
      await saveFile(fileName, JSON.stringify(data, null, 2));
      setSuccess(`File ${fileName} saved successfully!`);
    } catch (e: any) {
      setError(e.message || 'Failed to save file');
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!isAuthenticated) {
        await signIn();
      }
      
      const content = await readFile(fileName);
      if (content) {
        try {
          const data = JSON.parse(content);
          setFileContent(data.content || '');
          setSavedContent(data.content || '');
          setSuccess(`File ${fileName} loaded successfully!`);
        } catch (e) {
          setError('Invalid JSON format');
        }
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load file');
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
      <Text className="text-lg font-bold text-brand-800 mb-2">Cloud Storage Demo</Text>
      <Text className="text-brand-700 mb-4">Save and load property data using Puter.js cloud storage</Text>
      
      <View className="mb-4">
        <Text className="font-medium mb-1">File Name:</Text>
        <TextInput
          className="border border-brand-300 rounded-md p-2 bg-white"
          value={fileName}
          onChangeText={setFileName}
          placeholder="Enter file name"
        />
      </View>
      
      <View className="mb-4">
        <Text className="font-medium mb-1">Property Notes:</Text>
        <TextInput
          className="border border-brand-300 rounded-md p-2 bg-white h-24"
          value={fileContent}
          onChangeText={setFileContent}
          placeholder="Enter property notes or data"
          multiline
        />
      </View>
      
      <View className="flex-row justify-between mb-4">
        <TouchableOpacity 
          className="bg-brand-600 py-2 px-4 rounded-md flex-1 mr-2 items-center"
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-medium">Save to Cloud</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="bg-brand-800 py-2 px-4 rounded-md flex-1 ml-2 items-center"
          onPress={handleLoad}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-medium">Load from Cloud</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {error && (
        <View className="bg-red-100 p-2 rounded-md mb-2">
          <Text className="text-red-700">{error}</Text>
        </View>
      )}
      
      {success && (
        <View className="bg-green-100 p-2 rounded-md mb-2">
          <Text className="text-green-700">{success}</Text>
        </View>
      )}
      
      {savedContent && (
        <View className="mt-2">
          <Text className="font-medium mb-1">Last Loaded Content:</Text>
          <View className="bg-white p-2 rounded-md border border-brand-200">
            <Text className="text-brand-700">{savedContent}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default PuterStorageDemo;