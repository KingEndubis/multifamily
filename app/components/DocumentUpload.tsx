import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { usePuterContext } from '../services/PuterProvider';

// Allow using a native HTML input element when running on web
declare global {
  namespace JSX {
    interface IntrinsicElements {
      input: any;
    }
  }
}

const DocumentUpload: React.FC = () => {
  const { isLoaded, isAuthenticated, signIn, saveFile, listFiles, createDirectory } = usePuterContext();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshFiles = async () => {
    try {
      const items = await listFiles('documents/');
      setFiles(items || []);
    } catch (e: any) {
      // best effort only
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      try {
        await createDirectory('documents');
      } catch {}
      await refreshFiles();
    })();
  }, [isLoaded]);

  const handleFileSelected = async (evt: any) => {
    const file: File | undefined = evt?.target?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!isAuthenticated) {
        await signIn();
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      await saveFile(`documents/${safeName}`, file);
      setSuccess(`Uploaded ${safeName}`);
      await refreshFiles();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e: any) {
      setError(e?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const openFilePicker = () => {
    if (Platform.OS !== 'web') {
      setError('Document upload is available on web for now.');
      return;
    }
    fileInputRef.current?.click();
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
      <Text className="text-lg font-bold text-brand-800 mb-2">Document Uploads</Text>
      <Text className="text-brand-700 mb-4">Upload PDFs, spreadsheets, and notes to your cloud folder</Text>

      {/* Hidden web file input */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xlsx,.csv,.txt,.json"
          style={{ display: 'none' }}
          onChange={handleFileSelected}
        />
      )}

      <View className="flex-row gap-3 mb-4">
        <TouchableOpacity className="bg-brand-600 py-2 px-4 rounded-md items-center" onPress={openFilePicker} disabled={uploading}>
          {uploading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-medium">Upload Document</Text>}
        </TouchableOpacity>
        <TouchableOpacity className="bg-brand-800 py-2 px-4 rounded-md items-center" onPress={refreshFiles} disabled={uploading}>
          <Text className="text-white font-medium">Refresh List</Text>
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

      <View className="mt-2">
        <Text className="font-medium mb-2">Your Documents:</Text>
        {files?.length ? (
          files.map((f: any, idx: number) => (
            <View key={idx} className="bg-white p-2 rounded-md border border-brand-200 mb-2">
              <Text className="text-brand-700">{f?.name || JSON.stringify(f)}</Text>
            </View>
          ))
        ) : (
          <Text className="text-brand-600">No documents uploaded yet.</Text>
        )}
      </View>
    </View>
  );
};

export default DocumentUpload;