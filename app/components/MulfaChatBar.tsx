import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { usePuterContext } from '../services/PuterProvider';
import { useMulfaSubagent } from '../prompt-agent';
import { useCheckpointSubagent } from '../prompt-checkpoints';
import { extractUnderwritingDataFromFile, formatUnderwritingDataSummary } from '../services/analysis-service';
import jsPDF from 'jspdf';

// Allow using a native HTML input element when running on web
declare global {
  namespace JSX {
    interface IntrinsicElements {
      input: any;
    }
  }
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  attachments?: { name: string; path?: string }[];
}

const MulfaChatBar: React.FC = () => {
  const { isLoaded, isAuthenticated, signIn, saveFile, listFiles, createDirectory, chatWithAI } = usePuterContext();
  const { formatPrompt, lastUpdated } = useMulfaSubagent();
  const { formatCheckpointPrompt } = useCheckpointSubagent();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<{ name: string; file?: File; type?: string; path?: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const suggestionPresets = [
    { title: 'Underwrite this T-12', text: 'Underwrite this T-12: units 120, NOI 1.2M, purchase 15.5M, interest 6.25%, amort 30.' },
    { title: 'Market comps', text: 'Pull market comps and cap rates for Dallas Richardson submarket, Class B, 1985-2000.' },
    { title: 'DSCR & Loan size', text: 'Compute DSCR and conservative loan size given NOI 950k, rate 6.75%, 25-yr amort, LTV 65%.' },
    { title: 'Emerging market check', text: 'Evaluate emerging market signals for Huntsville, AL using Lindahl’s framework.' }
  ];

  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      try {
        await createDirectory('mulfa');
        await createDirectory('mulfa/pdfs');
      } catch {}
    })();
  }, [isLoaded]);

  const loadHistory = async () => {
    try {
      const items = await listFiles('mulfa/pdfs');
      setHistoryItems(items || []);
    } catch {}
  };

  const openFilePicker = () => {
    if (Platform.OS !== 'web') {
      setError('File attachments are available on web for now.');
      return;
    }
    setError(null);
    fileInputRef.current?.click();
  };

  const startDictation = () => {
    if (Platform.OS !== 'web') {
      setError('Voice dictation is available on web for now.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (evt: any) => {
      const txt: string = evt.results?.[0]?.[0]?.transcript || '';
      if (txt) setInput(prev => (prev ? prev + ' ' + txt : txt));
    };
    rec.onerror = (e: any) => setError('Speech error: ' + (e?.error || 'unknown'));
    rec.start();
  };

  const handleFilesSelected = async (evt: any) => {
    const files: FileList | undefined = evt?.target?.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const newAttachments: { name: string; file: File; type: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files.item(i)!;
        newAttachments.push({ name: f.name, file: f, type: f.type });
      }
      setAttachments(prev => [...prev, ...newAttachments]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e: any) {
      setError(e?.message || 'Failed to process attachments');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (name: string) => {
    setAttachments(prev => prev.filter(a => a.name !== name));
  };

  const exportPDF = async () => {
    try {
      if (!isAuthenticated) await signIn();
      const lastAnalysis = [...messages].reverse().find(m => m.role === 'ai');
      if (!lastAnalysis) {
        setError('No AI analysis to export.');
        return;
      }
      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const margin = 48;
      const maxWidth = 612 - margin * 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Mulfa Underwriting — Full Summary', margin, margin);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const timestamp = new Date().toLocaleString();
      doc.text(`Generated: ${timestamp}`, margin, margin + 18);

      const lines = doc.splitTextToSize(lastAnalysis.text, maxWidth);
      let y = margin + 42;
      lines.forEach((ln: string) => {
        if (y > 760) { doc.addPage(); y = margin; }
        doc.text(ln, margin, y);
        y += 16;
      });

      const pdfBlob = doc.output('blob');
      const filename = `mulfa/pdfs/underwriting_${Date.now()}.pdf`;
      await saveFile(filename, pdfBlob);
      await loadHistory();
      setShowHistory(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to export PDF');
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setSending(true);
    setError(null);
    try {
      // Do not force Puter sign-in here. The underlying chatWithAI() will fall back
      // to in-browser transformers.js when Puter.js is unavailable.
      // if (!isAuthenticated) { await signIn(); }

      // Build contextual prompt with attachments summary
      // Parse structured data from supported attachments (CSV/XLSX rent roll & T12)
      let dataSummary = '';
      try {
        const parsedPieces = [] as string[];
        for (const a of attachments) {
          if (a.file) {
            const data = await extractUnderwritingDataFromFile(a.file);
            const summary = formatUnderwritingDataSummary(data);
            parsedPieces.push(`${a.name}:\n${summary}`);
          }
        }
        dataSummary = parsedPieces.length ? parsedPieces.join('\n\n') : '';
      } catch (e: any) {
        // Non-fatal
      }

      const formattedPrompt = formatCheckpointPrompt(input, { attachments: attachments.map(a => a.name), dataSummary });

      const userMsg: ChatMessage = {
        id: String(Date.now()) + '_u',
        role: 'user',
        text: input,
        attachments: attachments.length ? attachments.map(a => ({ name: a.name, path: a.path })) : undefined,
      };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setAttachments([]);

      const result = await chatWithAI(formattedPrompt);
      const aiText = result?.response || 'No response received';
      const aiMsg: ChatMessage = {
        id: String(Date.now()) + '_a',
        role: 'ai',
        text: aiText,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e: any) {
      setError(e?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!isLoaded) {
    return (
      <View className="p-4 bg-brand-100 rounded-xl my-4">
        <Text className="text-brand-800 font-medium">Loading Puter.js...</Text>
      </View>
    );
  }

  // Grok-like home screen before first prompt; switch to dark chat after first message
  const isHome = messages.length === 0 && !sending;
  return (
    isHome ? (
      <View className="flex-1" style={{ backgroundColor: '#ffffff' }}>
        <View className="flex-1 items-center justify-center px-4">
          {/* Minimal home canvas (wordmark removed for cleaner look) */}
          <View className="items-center mb-8" />
          {/* Hidden web file input (enabled on home state so 📎 works immediately) */}
          {Platform.OS === 'web' && (
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.txt,.json"
              multiple
              style={{ display: 'none' }}
              onChange={handleFilesSelected}
            />
          )}
          {/* Bottom-centered chat bar (minimal home) */}
          <View className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4 pb-6">
            {attachments.length > 0 && (
              <View className="bg-white rounded-t-xl border border-gray-200 border-b-0 px-4 py-3">
                <View className="flex-row flex-wrap">
                  {attachments.map(a => (
                    <View key={a.name} className="bg-gray-100 border border-gray-200 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center">
                      <Text className="text-xs text-gray-700">{a.name}</Text>
                      <TouchableOpacity onPress={() => removeAttachment(a.name)} className="ml-2">
                        <Text className="text-gray-500 text-xs font-bold">✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
            <View className={`bg-white rounded-full border border-gray-200 shadow-lg flex-row items-center px-4 py-3 ${attachments.length > 0 ? 'rounded-t-none border-t-0 rounded-b-full' : ''}`}>
              <TouchableOpacity onPress={openFilePicker} className="mr-3" disabled={uploading}>
                <Text className="text-gray-700 text-xl">{uploading ? '⏳' : '📎'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={startDictation} className="mr-3" disabled={sending}>
                <Text className="text-gray-700 text-xl">🎤</Text>
              </TouchableOpacity>
              <TextInput
                className="flex-1 text-base text-gray-900"
                value={input}
                onChangeText={setInput}
                placeholder="Ask about cap rates, NOI, DSCR, or upload property docs..."
                placeholderTextColor="#9CA3AF"
                multiline={false}
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity onPress={sendMessage} className={`px-4 py-2 rounded-full ${sending || !input.trim() ? 'bg-gray-200' : 'bg-black'}`} disabled={sending || !input.trim()}>
                <Text className={`text-sm font-medium ${sending || !input.trim() ? 'text-gray-500' : 'text-white'}`}>{sending ? '…' : 'Send'}</Text>
              </TouchableOpacity>
            </View>
            {error && (
              <View className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                <Text className="text-red-800 text-sm">{error}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    ) : (
      <View className="flex-1" style={{ backgroundColor: '#ffffff' }}>
        {/* Minimalist chat mode (no header) */}

        {/* Suggestions removed for minimalist layout */}

        {/* History panel hidden for minimal layout */}

        {/* Messages - Single Column */}
        <ScrollView className="flex-1 px-4 py-2 max-w-4xl mx-auto w-full">
          {messages.map((msg) => (
            <View key={msg.id} className={`mb-4 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <View className={`max-w-[85%] p-4 rounded-2xl shadow-soft ${msg.role === 'user' ? 'ml-auto' : ''}`} style={ msg.role === 'user' ? { backgroundColor: '#000000' } : { backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidth: 1 } }>
                <Text className={`text-sm leading-relaxed`} style={{ color: msg.role === 'user' ? '#ffffff' : '#111827' }}>
                  {msg.text}
                </Text>
                {msg.attachments && msg.attachments.length > 0 && (
                  <View className="mt-3 flex-row flex-wrap">
                    {msg.attachments.map((att, idx) => (
                      <View key={idx} className="px-3 py-1 rounded-full mr-2 mb-1" style={{ backgroundColor: '#f3f4f6', borderColor: '#e5e7eb', borderWidth: 1 }}>
                        <Text className="text-xs" style={{ color: '#374151' }}>{att.name}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {msg.role === 'ai' && (
                  <TouchableOpacity onPress={exportPDF} className="mt-3 px-3 py-2 rounded-lg self-start" style={{ backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' }}>
                    <Text className="text-xs font-medium" style={{ color: '#374151' }}>Export PDF</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          {sending && (
            <View className="mb-4 items-start">
              <View className="bg-white border border-gray-200 p-4 rounded-xl shadow-soft flex-row items-center">
                <ActivityIndicator size="small" color="#111827" />
                <Text className="text-sm text-gray-700 ml-3">Analyzing property data...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Hidden web file input */}
        {Platform.OS === 'web' && (
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.txt,.json"
            multiple
            style={{ display: 'none' }}
            onChange={handleFilesSelected}
          />
        )}

        {/* Fixed Bottom Chat Bar */}
        <View className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4 pb-4">
          {/* Attachments */}
          {attachments.length > 0 && (
            <View className="bg-white rounded-t-xl border border-gray-200 border-b-0 px-4 py-3">
              <View className="flex-row flex-wrap">
                {attachments.map(a => (
                  <View key={a.name} className="bg-brand-50 border border-brand-200 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center">
                    <Text className="text-xs text-brand-700">{a.name}</Text>
                    <TouchableOpacity onPress={() => removeAttachment(a.name)} className="ml-2">
                      <Text className="text-brand-500 text-xs font-bold">✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Input Bar */}
          <View className={`bg-white rounded-full border border-gray-200 shadow-lg flex-row items-center px-4 py-3 ${attachments.length > 0 ? 'rounded-t-none border-t-0 rounded-b-full' : ''}`}>
            <TouchableOpacity onPress={openFilePicker} className="mr-3" disabled={uploading}>
              <Text className="text-gray-700 text-xl">{uploading ? '⏳' : '📎'}</Text>
            </TouchableOpacity>
            <TextInput
              className="flex-1 text-sm text-gray-900 min-h-[40px] max-h-[120px]"
              value={input}
              onChangeText={setInput}
              placeholder="Ask about cap rates, NOI, DSCR, or upload property docs..."
              placeholderTextColor="#9CA3AF"
              multiline
              style={{ textAlignVertical: 'top' }}
            />
            <TouchableOpacity onPress={startDictation} className="mr-3" disabled={sending}>
              <Text className="text-gray-700 text-xl">🎤</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={sendMessage} className={`px-4 py-2 rounded-full ${sending || !input.trim() ? 'bg-gray-200' : 'bg-black'}`} disabled={sending || !input.trim()}>
              <Text className={`text-sm font-medium ${sending || !input.trim() ? 'text-gray-500' : 'text-white'}`}>
                {sending ? 'Sending…' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
              <Text className="text-red-800 text-sm">{error}</Text>
            </View>
          )}
        </View>
      </View>
    )
  );
};

export default MulfaChatBar;