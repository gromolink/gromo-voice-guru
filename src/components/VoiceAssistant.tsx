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
    greeting: "Vanakkam! I'm Maya, your Gromo business assistant. I help local vendors grow their business and connect customers with nearby services. If you need immediate support, you can call us at 8-4-3-8-7-8-5-7-7-9 or send an email. You can also visit our website at gromo-web-forge.vercel.app to explore different types of businesses on our platform. Whether you want to register your shop, find local vendors, or learn about earning opportunities - I'm here to guide you. What would you like to know?",
    
    // Vendor registration
    "register|vendor|join|signup": "Super! To join as a vendor, I'll need your business name, location, and mobile number. You can register through our app or website. What type of business do you want to promote?",
    
    // Location services - Enhanced with district/place handling
    "nearest|tea|stall|shop|location|where|find": "I can help you find nearby vendors! Which district or area are you in? Please tell me your location like - Salem, Namakkal, Rasipuram, or any other place.",
    
    // Specific location responses
    "salem": "Great! In Salem district, we have many vendors - 15+ tea stalls near Junction, 8 hotels in Five Roads area, and several construction workers in Ammapet. What type of service do you need?",
    "namakkal": "Perfect! Namakkal has excellent vendors - 10+ tea stalls in Bus Stand area, 5 hotels near Collectorate, and many local services in Mohanur road. What are you looking for?",
    "rasipuram": "Nice! Rasipuram area has growing vendors - 8 tea stalls near Market, 4 hotels in Main Road, and construction services in Velur road. Which service interests you?",
    "erode": "Excellent! Erode has many active vendors - 20+ tea stalls in Perundurai road, 12 hotels in Bus Stand area, and various services in Bhavani. What do you need?",
    "tiruchengode": "Good choice! Tiruchengode has local vendors - 6 tea stalls near Temple area, 3 hotels in Main road, and local services. What service are you searching for?",
    
    // Earnings and revenue
    "earn|money|income|profit|revenue": "Great question! With Gromo, vendors typically earn 20-40% more customers. Tea stalls earn ₹500-2000 extra daily, while hotels can get 50+ new customers per month!",
    
    // Business types and services
    "business|promote|advertise|service|what": "You can promote many businesses on Gromo - tea stalls, hotels, restaurants, construction services, repair shops, grocery stores, medical shops, beauty parlors, and more! What's your business type?",
    
    // How Gromo works
    "how|works|process|platform": "Gromo connects local vendors with customers! Vendors register their business, customers find them nearby, and both benefit. Vendors get more customers, customers get convenient local services!",
    
    // Pricing and costs
    "price|cost|fee|charge|payment": "Gromo has very affordable pricing! Registration is free for vendors. We only charge a small commission when you get customers. No upfront costs - you earn first, then pay!",
    
    // App and website
    "app|download|website|online": "You can use Gromo through our mobile app or website at gromo-web-forge.vercel.app. Both are easy to use - vendors can register and customers can find services easily!",
    
    // Customer benefits
    "customer|user|benefit|why": "Customers love Gromo because they can quickly find nearby vendors, read reviews, compare services, and get quality local services. It saves time and ensures reliable vendors!",
    
    // Success stories
    "success|story|example|testimonial": "Many vendors have grown with Gromo! Ravi's tea stall in Salem doubled customers in 3 months. Priya's hotel in Namakkal gets 100+ orders daily now. Your success story could be next!",
    
    // Competition and advantages
    "better|advantage|different|why choose": "Gromo focuses on local Tamil vendors and customers. We understand local needs, provide Tamil support, affordable pricing, and personal assistance. We're built for our community!",
    
    // Technical support
    "problem|issue|technical|not working": "No worries! For any technical issues, call our support at 8-4-3-8-7-8-5-7-7-9. Our team will help you immediately. You can also email us or visit our website for instant chat support!",
    
    // General help
    "help|support|contact|assistance": "I'm here to help! You can ask me about vendor registration, finding nearby services, earnings potential, how Gromo works, pricing, or any other questions. What would you like to know?",
    
    // Greetings and casual
    "hi|hello|vanakkam|good morning|good evening": "Vanakkam! Welcome to Gromo! I'm Maya, your friendly business assistant. How can I help you grow your business or find local services today?",
    
    // Thank you responses
    "thank|thanks|nandri": "You're most welcome! I'm always here to help you with Gromo. If you have any more questions about growing your business or finding vendors, just ask me anytime!",
    
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
      
      // Enhanced voice settings for more beautiful voice
      utterance.lang = 'en-IN';
      utterance.rate = 0.85; // Slightly slower for clarity
      utterance.pitch = 1.2; // Higher pitch for more pleasant sound
      utterance.volume = 0.9;
      
      // Try to use a female voice if available
      const voices = synthRef.current.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.lang.includes('en') && 
        (voice.name.toLowerCase().includes('female') || 
         voice.name.toLowerCase().includes('woman') ||
         voice.name.toLowerCase().includes('samantha') ||
         voice.name.toLowerCase().includes('microsoft zira'))
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // Auto-start listening after response for continuous conversation
        setTimeout(() => {
          if (speechSupported && !isListening) {
            startListening();
          }
        }, 1000);
      };
      
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