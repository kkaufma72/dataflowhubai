import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface VoiceQueryInterfaceProps {
  onQuery: (query: string) => Promise<string>;
  className?: string;
}

// Declare SpeechRecognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const VoiceQueryInterface: React.FC<VoiceQueryInterfaceProps> = ({
  onQuery,
  className = ''
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      console.warn('Speech recognition not supported in this browser');
    }
  }, []);

  const startListening = () => {
    if (!isSupported) {
      toast.error('Voice input not supported in this browser. Try Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      toast.success('🎙️ Listening... Speak now!');
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      setTranscript(transcriptText);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'no-speech') {
        toast.error('No speech detected. Please try again.');
      } else if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please enable in browser settings.');
      } else {
        toast.error(`Voice error: ${event.error}`);
      }
    };

    recognition.onend = async () => {
      setIsListening(false);
      
      if (transcript.trim()) {
        toast.loading('Processing your question...', { id: 'voice-query' });
        
        try {
          // Send to AI for processing
          const response = await onQuery(transcript);
          
          toast.success('Got your answer!', { id: 'voice-query' });
          
          // Speak the response
          speakResponse(response);
        } catch (error) {
          toast.error('Failed to process query', { id: 'voice-query' });
          console.error('Voice query error:', error);
        }
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Text-to-speech not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  if (!isSupported) {
    return null; // Don't show if browser doesn't support
  }

  return (
    <div className={className}>
      {/* Voice Button */}
      <button
        onClick={isListening ? stopListening : startListening}
        disabled={isSpeaking}
        className={`
          group relative w-14 h-14 rounded-full shadow-2xl transition-all
          ${isListening 
            ? 'bg-red-500 animate-pulse scale-110' 
            : isSpeaking
              ? 'bg-purple-500'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-110 hover:shadow-3xl'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={isListening ? 'Click to stop' : 'Click to speak'}
      >
        {isListening ? (
          <MicOff className="w-6 h-6 text-white" />
        ) : isSpeaking ? (
          <Volume2 className="w-6 h-6 text-white animate-pulse" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}

        {/* Pulse Ring Animation */}
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></span>
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" style={{ animationDelay: '0.3s' }}></span>
          </>
        )}

        {/* Sparkles for first-time users */}
        {!isListening && !isSpeaking && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </button>

      {/* Transcript Display */}
      {transcript && (
        <div className="absolute bottom-20 right-0 max-w-xs bg-white rounded-xl shadow-2xl border-2 border-indigo-200 p-4">
          <p className="text-sm font-medium text-gray-900 mb-1">You said:</p>
          <p className="text-sm text-gray-700 italic">"{transcript}"</p>
        </div>
      )}

      {/* Status Indicator */}
      <div className="absolute -top-2 -left-2">
        {isListening && (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            LISTENING
          </div>
        )}
        {isSpeaking && (
          <div className="flex items-center gap-1 px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
            <Volume2 className="w-3 h-3 animate-pulse" />
            SPEAKING
          </div>
        )}
      </div>

      {/* Stop Speaking Button */}
      {isSpeaking && (
        <button
          onClick={stopSpeaking}
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full hover:bg-gray-800"
        >
          <VolumeX className="w-3 h-3 inline mr-1" />
          Stop
        </button>
      )}
    </div>
  );
};

export default VoiceQueryInterface;
