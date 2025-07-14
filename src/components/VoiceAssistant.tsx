import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Extend Window interface for speech APIs
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // FAQ responses for Gromo business
  const responses: Record<string, string> = {
    greeting: "Vanakkam! I'm Maya, your Gromo business assistant. I help local vendors grow their business and connect customers with nearby services. Whether you want to register your shop, find local vendors, or learn about earning opportunities - I'm here to guide you through everything Gromo offers. How can I assist you today?",
    
    // Vendor registration
    "register|vendor|join|signup": "Super! To join as a vendor, I'll need your business name, location, and mobile number. You can register through our app or website. What type of business do you want to promote?",
    
    // Location services
    "nearest|tea|stall|shop|location": "I can help you find the nearest tea stall! Please share your location, and I'll show you all nearby vendors on our platform.",
    
    // Earnings
    "earn|money|income|profit": "Great question! With Gromo, vendors typically earn 20-40% more customers. Tea stalls earn ₹500-2000 extra daily, while hotels can get 50+ new customers per month!",
    
    // Business types
    "business|promote|advertise": "You can promote many businesses on Gromo - tea stalls, hotels, restaurants, construction services, repair shops, grocery stores, and more! What's your business type?",
    
    // General help
    "help|support|contact": "I'm here to help! You can ask me about vendor registration, finding nearby services, earnings potential, or how Gromo works. What would you like to know?",
    
    // Default fallback
    default: "I didn't get that clearly. Please say it again, or ask me about vendor registration, nearby services, or how to earn with Gromo!"
  };

  useEffect(() => {
    // Initialize speech recognition and synthesis
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN'; // Support for Indian English/Tamil

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setCurrentTranscript('');
      };

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCurrentTranscript(transcript);

        if (event.results[event.results.length - 1].isFinal) {
          handleUserMessage(transcript.trim());
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice Error",
          description: "Could not understand. Please try again.",
          variant: "destructive"
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setCurrentTranscript('');
      };

      setSpeechSupported(true);
    }

    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Initial greeting
    setTimeout(() => {
      speakText(responses.greeting);
    }, 1000);
  }, []);

  const startListening = () => {
    if (recognitionRef.current && speechSupported) {
      recognitionRef.current.start();
    } else {
      toast({
        title: "Voice Not Supported",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive"
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const speakText = (text: string) => {
    if (synthRef.current) {
      // Stop any ongoing speech
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      synthRef.current.speak(utterance);
    }
  };

  const handleUserMessage = (transcript: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: transcript,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Find appropriate response
    const lowerTranscript = transcript.toLowerCase();
    let response = responses.default;

    for (const [pattern, responseText] of Object.entries(responses)) {
      if (pattern !== 'greeting' && pattern !== 'default') {
        const keywords = pattern.split('|');
        if (keywords.some(keyword => lowerTranscript.includes(keyword))) {
          response = responseText;
          break;
        }
      }
    }

    // Add bot response
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: response,
      isUser: false,
      timestamp: new Date()
    };

    setTimeout(() => {
      setMessages(prev => [...prev, botMessage]);
      speakText(response);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-gromo/10 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-4 bg-gromo rounded-full flex items-center justify-center shadow-lg animate-float">
          <img 
            src="/lovable-uploads/ceeed7af-e0c2-473a-a927-38820bf28b70.png" 
            alt="Gromo Logo" 
            className="w-16 h-16 object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Gromo Voice Assistant</h1>
        <p className="text-muted-foreground">Your local business companion</p>
      </div>

      {/* Voice Interface */}
      <Card className="w-full max-w-md mb-6 shadow-xl border-gromo/20">
        <CardContent className="p-6 text-center">
          <div className="relative mb-6">
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isSpeaking}
              size="lg"
              className={`w-20 h-20 rounded-full transition-all duration-300 ${
                isListening 
                  ? 'bg-gromo-voice-listening animate-voice-pulse shadow-[0_0_30px_hsl(var(--gromo-voice-listening))]' 
                  : isSpeaking
                  ? 'bg-gromo-voice-active animate-voice-pulse'
                  : 'bg-gromo hover:bg-gromo-dark'
              } shadow-[var(--gromo-shadow)]`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : isSpeaking ? (
                <Volume2 className="w-8 h-8 text-white animate-voice-wave" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </Button>
            
            {/* Voice waves animation */}
            {(isListening || isSpeaking) && (
              <div className="absolute inset-0 flex items-center justify-center">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`absolute w-20 h-20 border-2 border-gromo/30 rounded-full animate-voice-pulse`}
                    style={{
                      animationDelay: `${i * 0.2}s`,
                      transform: `scale(${1 + i * 0.3})`
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {isListening && (
              <div className="text-gromo-voice-listening font-medium">
                🎤 Listening...
              </div>
            )}
            {isSpeaking && (
              <div className="text-gromo-voice-active font-medium">
                🔊 Speaking...
              </div>
            )}
            {currentTranscript && (
              <div className="text-sm text-muted-foreground border-l-2 border-gromo pl-3">
                "{currentTranscript}"
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            {isListening 
              ? "Speak now..." 
              : isSpeaking 
              ? "Let me respond..." 
              : "Tap the microphone to start talking"
            }
          </p>
        </CardContent>
      </Card>

      {/* Chat History */}
      {messages.length > 0 && (
        <Card className="w-full max-w-md max-h-64 overflow-y-auto">
          <CardContent className="p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 text-sm ${
                    message.isUser
                      ? 'bg-gromo text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="w-full max-w-md mt-6 space-y-2">
        <p className="text-center text-sm text-muted-foreground mb-3">Try asking:</p>
        <div className="grid grid-cols-1 gap-2">
          {[
            "How do I register as a vendor?",
            "Where is the nearest tea stall?",
            "How much can I earn with Gromo?",
            "What businesses can I promote?"
          ].map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-xs border-gromo/20 hover:bg-gromo/10"
              onClick={() => handleUserMessage(question)}
            >
              {question}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;