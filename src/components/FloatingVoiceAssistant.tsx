import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, X, Send, Volume2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface VoiceAssistantProps {
  position?: 'bottom-right' | 'bottom-left';
  accentColor?: string;
  defaultOpen?: boolean;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export const FloatingVoiceAssistant: React.FC<VoiceAssistantProps> = ({
  position = 'bottom-right',
  accentColor = '#4F46E5',
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    "Tell me about vendor registration",
    "How can I earn more?",
    "Find vendors near me",
    "What businesses can I promote?"
  ];

  const responses: { [key: string]: string } = {
    "vendor|register|registration|join": "To register as a vendor on Gromo, call us at 8-4-3-8-7-8-5-7-7-9 or visit gromo-web-forge.vercel.app. Registration is free and takes just 5 minutes!",
    "salem": "Salem has many active vendors! 15+ tea stalls near Railway station, 8 hotels in Town area, and various services. What are you looking for?",
    "namakkal": "Great choice! Namakkal has excellent vendors - 10 tea stalls in Bus Stand area, 5 hotels near Temple, and many local services. How can I help?",
    "rasipuram": "Rasipuram has growing vendors - 8 tea stalls in Market area, 4 hotels in Main road, and local services. What do you need?",
    "erode": "Excellent! Erode has many active vendors - 20+ tea stalls in Perundurai road, 12 hotels in Bus Stand area, and various services in Bhavani. What do you need?",
    "tiruchengode": "Good choice! Tiruchengode has local vendors - 6 tea stalls near Temple area, 3 hotels in Main road, and local services. What service are you searching for?",
    "earn|money|income|profit|revenue": "Great question! With Gromo, vendors typically earn 20-40% more customers. Tea stalls earn ₹500-2000 extra daily, while hotels can get 50+ new customers per month!",
    "business|promote|advertise|service|what": "You can promote many businesses on Gromo - tea stalls, hotels, restaurants, construction services, repair shops, grocery stores, medical shops, beauty parlors, and more! What's your business type?",
    "how|works|process|platform": "Gromo connects local vendors with customers! Vendors register their business, customers find them nearby, and both benefit. Vendors get more customers, customers get convenient local services!",
    "price|cost|fee|charge|payment": "Gromo has very affordable pricing! Registration is free for vendors. We only charge a small commission when you get customers. No upfront costs - you earn first, then pay!",
    "app|download|website|online": "You can use Gromo through our mobile app or website at gromo-web-forge.vercel.app. Both are easy to use - vendors can register and customers can find services easily!",
    "customer|user|benefit|why": "Customers love Gromo because they can quickly find nearby vendors, read reviews, compare services, and get quality local services. It saves time and ensures reliable vendors!",
    "success|story|example|testimonial": "Many vendors have grown with Gromo! Ravi's tea stall in Salem doubled customers in 3 months. Priya's hotel in Namakkal gets 100+ orders daily now. Your success story could be next!",
    "help|support|contact|assistance": "I'm here to help! You can ask me about vendor registration, finding nearby services, earnings potential, how Gromo works, pricing, or any other questions. What would you like to know?",
    "hi|hello|vanakkam|good morning|good evening": "Vanakkam! Welcome to Gromo! I'm Maya, your friendly business assistant. How can I help you grow your business or find local services today?",
    "thank|thanks|nandri": "You're most welcome! I'm always here to help you with Gromo. If you have any more questions about growing your business or finding vendors, just ask me anytime!",
    default: "I didn't get that clearly. Please say it again, or ask me about vendor registration, nearby services, or how to earn with Gromo!"
  };

  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleUserMessage(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUserMessage = (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    // Process response
    setIsProcessing(true);
    setTimeout(() => {
      const response = getResponse(text.toLowerCase());
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsProcessing(false);
      
      // Speak response
      speak(response);
    }, 1000);
  };

  const getResponse = (input: string): string => {
    for (const [pattern, response] of Object.entries(responses)) {
      if (pattern !== 'default') {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(input)) {
          return response;
        }
      }
    }
    return responses.default;
  };

  const speak = (text: string) => {
    if (synthRef.current) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      synthRef.current.speak(utterance);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      handleUserMessage(inputText);
    }
  };

  const handleQuickAction = (action: string) => {
    handleUserMessage(action);
  };

  const toggleWidget = () => {
    setIsOpen(!isOpen);
  };

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  const positionClasses = position === 'bottom-right' 
    ? 'bottom-5 right-5' 
    : 'bottom-5 left-5';

  return (
    <div className="fixed z-50" style={{ zIndex: 9999 }}>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={toggleWidget}
          className={`fixed ${positionClasses} w-12 h-12 rounded-full shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center`}
          style={{ backgroundColor: accentColor }}
        >
          <img 
            src="/lovable-uploads/2ea3c8af-7a35-463d-a05a-fbbc62628152.png" 
            alt="Gromo Assistant" 
            className="w-7 h-7"
          />
        </button>
      )}

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleOutsideClick}
        >
          <div 
            className="bg-white rounded-xl shadow-xl border border-gray-200 animate-scale-in"
            style={{ 
              width: '300px', 
              height: '500px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-4 border-b border-gray-200 rounded-t-xl text-white"
              style={{ backgroundColor: accentColor }}
            >
              <h3 className="font-semibold text-sm">Gromo Voice Assistant</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="text-center mb-8">
                <img 
                  src="/lovable-uploads/2ea3c8af-7a35-463d-a05a-fbbc62628152.png" 
                  alt="Gromo Assistant" 
                  className="w-16 h-16 mx-auto mb-4"
                />
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Gromo Voice Assistant</h4>
                <p className="text-sm text-gray-600">Click the microphone to start talking</p>
              </div>

              {/* Voice Button */}
              <button
                onClick={() => {
                  if (!showGreeting) {
                    setShowGreeting(true);
                    const greetingMessage = "Vanakkam! I'm Maya from Gromo. How can I help you grow your business today?";
                    speak(greetingMessage);
                  } else {
                    isListening ? stopListening() : startListening();
                  }
                }}
                className={`w-20 h-20 rounded-full transition-all duration-200 flex items-center justify-center ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'hover:bg-gray-100'
                }`}
                style={{ 
                  backgroundColor: isListening ? '#EF4444' : accentColor,
                  color: 'white'
                }}
              >
                {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>

              {/* Status */}
              <div className="mt-4 text-center">
                {isListening && (
                  <p className="text-sm text-red-600 animate-pulse">Listening...</p>
                )}
                {isProcessing && (
                  <p className="text-sm text-blue-600">Processing...</p>
                )}
                {isSpeaking && (
                  <div className="flex items-center justify-center">
                    <Volume2 className="w-4 h-4 text-green-500 animate-pulse mr-2" />
                    <p className="text-sm text-green-600">Speaking...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};