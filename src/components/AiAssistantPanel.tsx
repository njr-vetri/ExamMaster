import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, MessageCircle, HelpCircle, ArrowRight, User, RefreshCw, X } from 'lucide-react';
import { Question, ChatMessage, ExamLanguage } from '../types';
import { sendChatMessage } from '../services/api';

interface AiAssistantPanelProps {
  currentDoubtQuestion?: Question | null;
  onClose?: () => void;
  langSetting?: ExamLanguage;
}

export default function AiAssistantPanel({
  currentDoubtQuestion,
  onClose,
  langSetting = 'bilingual'
}: AiAssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeLang, setActiveLang] = useState<ExamLanguage>(langSetting);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize welcomed explanation message on start or updated doubt question
  useEffect(() => {
    let initialGreeting = '';
    
    if (currentDoubtQuestion) {
      initialGreeting = getContextGreeting(currentDoubtQuestion, activeLang);
    } else {
      initialGreeting = getGeneralGreeting(activeLang);
    }

    setMessages([
      {
        id: 'greet-1',
        sender: 'assistant',
        text: initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        relatedQuestionId: currentDoubtQuestion?.id
      }
    ]);
  }, [currentDoubtQuestion, activeLang]);

  useEffect(() => {
    // Scroll to bottom on updates
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  function getGeneralGreeting(lang: ExamLanguage) {
    if (lang === 'tamil') {
      return 'வணக்கம்! நான் உங்கள் AI தேர்வு வழிகாட்டி. நீங்கள் ஏதேனும் கேள்விக்கான விளக்கம் அல்லது கடினமான பாடப்பகுதிகளைப் பற்றி சந்தேகம் கேட்கலாம். நான் தமிழில் எளிமையாக விளக்குகிறேன்!';
    } else if (lang === 'bilingual') {
      return 'வணக்கம்! Welcome! I am your AI Study Coach. Feel free to ask any doubt, request a simpler explanation, or ask for analogies in Tamil, English, or Bilingual mode. Let\'s master this! 🌟';
    } else {
      return 'Hello! I am your AI Exam Coach. Ask me any doubt about any question, request alternative explanations, or ask for real-world examples. Let\'s learn together!';
    }
  }

  function getContextGreeting(q: Question, lang: ExamLanguage) {
    if (lang === 'tamil') {
      return `கேள்விக்கான விளக்கம் கேட்கப்பட்டது:\n\n**"${q.text}"**\n\nசரியான விடை: **${q.options[q.correctOptionIndex]}**\n\nவிளக்கம்: ${q.explanationTamil || q.explanation}\n\nஇந்தக் கேள்வி அல்லது இதன் கோட்பாட்டைப் பற்றி மேலும் ஏதேனும் சந்தேகம் உள்ளதா? என்னிடம் தாராளமாகக் கேளுங்கள்!`;
    } else if (lang === 'bilingual') {
      return `You asked for a doubt review concerning:\n\n**"${q.text}"**\n\nCorrect Option: **${q.options[q.correctOptionIndex]}**\n\n💡 Rational Breakdown / விளக்கம்:\n${q.explanation}\n\nHow can I simplify this for you? (எப்படி இதை உங்களுக்கு எளிதாக்கலாம்?)\n- Ask for an analogy (உதாரணம் கேளுங்கள்)\n- Translate difficult words (சொற்கள் விளக்கம்)`;
    } else {
      return `Doubt initiated on Question:\n\n**"${q.text}"**\n\nCorrect Option: **${q.options[q.correctOptionIndex]}**\n\n💡 Current Rationale:\n${q.explanation}\n\nDo you want me to expand on this topic, give you a real-world scenario, or test you with a similar question? Let me know!`;
    }
  }

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const history = messages.slice(-6).map(m => ({ sender: m.sender, text: m.text }));
      const replyText = await sendChatMessage({
        message: textToSend,
        language: activeLang,
        doubtQuestion: currentDoubtQuestion || null,
        history
      });

      setMessages(prev => [...prev, {
        id: `msg-ai-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        relatedQuestionId: currentDoubtQuestion?.id
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I could not connect to the AI tutor right now. Please check your internet connection and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Pre-coded dynamic tutors
  function generateSmartContextReply(prompt: string, q: Question, lang: ExamLanguage): string {
    const isAnalogy = prompt.includes('analogy') || prompt.includes('example') || prompt.includes('உதாரணம்') || prompt.includes('வழியாக');
    const isSimplify = prompt.includes('simplify') || prompt.includes('simpler') || prompt.includes('எளிமை') || prompt.includes('புரியவில்லை');
    const isFormula = prompt.includes('formula') || prompt.includes('fact') || prompt.includes('விதி') || prompt.includes('சூத்திரம்') || prompt.includes('key point');

    if (isAnalogy) {
      if (lang === 'tamil') {
        return `இதை ஒரு எளிய நிஜ வாழ்க்கைக் காரணியோடு ஒப்பிடுவோம்:\n\nநினைத்துப் பாருங்கள், நாம் ஒரு மளிகைக் கடைக்குச் சென்று பொருட்களை வரிசைப்படுத்துவது போல அல்லது உங்கள் கணினியில் உள்ள கோப்புகளை தனித்தனி கோப்புறைகளில் வைப்பது போல இது செயல்படுகிறது. \n\nகேட்டுள்ள கருத்தின் அடிப்படை: ${q.subject} என்பது இதற்கு உகந்ததாகும்!`;
      } else if (lang === 'bilingual') {
        return `Let's use a simple real-world Analogy (எளிய உதாரணம்):\n\nThink of **${q.subject}** like baking a cake. If you don't add the yeast (the catalyst), the bread won't rise. Similarly, in this question, the key trigger was having the proper variables align. \n\nதமிழில்:\nஒரு சமையல் குறிப்பைப் போன்றது தான் இது. சரியான பொருட்களை சரியான அளவில் சேர்க்காவிட்டால் பலன் கிடைக்காது!`;
      } else {
        return `Here is a intuitive analogy for **${q.subject}**:\n\nImagine a busy post office sorting mail (this represents the core mechanism). If the letters don't have zip codes (indexes), sorting becomes O(n) slow search instead of O(1) instant delivery. That is why the answer chose the faster path!`;
      }
    }

    if (isSimplify) {
      if (lang === 'tamil') {
        return `சுருக்கமாகச் சொன்னால்:\n\n1. கேள்வி கையாள்வது: **${q.subject}**\n2. முக்கிய விஷயம்: உங்கள் நினைவில் கொள்ள வேண்டியது சரியான் விடைதான். இதில் குழப்பமடையத் தேவையில்லை, ஏனெனில் மற்ற விருப்பங்கள் தவறான திசைவேகம் உடையவை.`;
      } else if (lang === 'bilingual') {
        return `Let's strip away the exam jargon! (சுருக்கமாகப் பார்ப்போம்):\n\n- **Core Fact**: ${q.options[q.correctOptionIndex]} is the ultimate truth here.\n- **Why others failed**: The other choices were designed to distract you. Keep your focus on this primary rule and you won't get confused next time!\n\nஎளிதாகச் சொன்னால், இந்த விஷயத்தில் இது மட்டுமே உண்மையான காரணி ஆகும்.`;
      } else {
        return `Let's simplify it completely:\n\nThis boils down to one fundamental concept: **Actions have reactions**, or in this specific case, the subject dictates that options outside of "${q.options[q.correctOptionIndex]}" are logically impossible. Think of it as a binary choice!`;
      }
    }

    if (isFormula) {
      if (lang === 'tamil') {
        return `நினைவில் கொள்ள வேண்டிய 2 முக்கிய குறிப்புகள்:\n\n1. **முதல் குறிப்பு**: இப்பாடத்தில் கேட்கப்பட்டுள்ள முக்கிய வரையறையை எப்போதும் நினைவில் வையுங்கள்.\n2. **இரண்டாம் குறிப்பு**: தேர்வு எழுதும் போது முதலில் எளிதான தவறுகளைக் களைந்து விடுங்கள்!`;
      } else if (lang === 'bilingual') {
        return `🔑 2 Golden facts to memorize (மனப்பாடம் செய்ய வேண்டியவை):\n\n1. **Fact 1**: ${q.subject} is defined strictly under standardized guidelines.\n2. **Fact 2**: The core variable inside "${q.options[q.correctOptionIndex]}" can never be zero or negative.\n\nஇந்த இரண்டு விதிகளை மனதில் வைத்தால் எவ்வித கேள்வியையும் எளிதாக வெல்லலாம்!`;
      } else {
        return `Here are 2 core learning takeaways for **${q.subject}**:\n\n1. **Rule of Exclusion**: Cross out the obviously wrong choices first (like the extreme scale options).\n2. **Definition Match**: The correct answer matches the formal academic definition perfectly. Write this definition down in your revision notes to stabilize it!`;
      }
    }

    // Default fallbacks
    if (lang === 'tamil') {
      return `மிகச் சிறந்த வினா! இப்பாடப்பகுதி விரிவானது. மாற்று வடிவத்தில் புரிந்துகொள்ள முந்தைய வினாக்களைக் கணக்கில் கொள்ளவும். மேலும் ஏதேனும் கேள்வி இருந்தால் கேளுங்கள்.`;
    } else if (lang === 'bilingual') {
      return `Interesting point! (நல்ல கேள்வி). In studying **${q.subject}**, keeping this core concept close prepares you for related harder questions. Would you like me to elaborate further on another option?`;
    } else {
      return `That's a very analytical student question. In **${q.subject}**, the specific details make all the difference. Do you want me to quiz you with another similar question to practice?`;
    }
  }

  function generateGeneralSmartReply(prompt: string, lang: ExamLanguage): string {
    if (lang === 'tamil') {
      return `புரிந்துகொண்டேன். தேர்வு தயாரிப்பு என்பது தொடர் பயிற்சி ஆகும். நீங்கள் புதிய வினாத்தாள் ஒன்றை 'Upload Material' பக்கத்தில் உருவாக்கி பயிற்சி செய்யுமாறு பரிந்துரைக்கிறேன்!`;
    } else if (lang === 'bilingual') {
      return `I completely appreciate your study goal! 📝 The fastest way to level up in this subject is to generate a custom 5-question mock test in Easy difficulty first, and slowly scale up as you grow. Let's do that!`;
    } else {
      return `Excellent thought. Regular revision is the key to deep retention. Try heading over to the 'Question Bank' to review all previously generated questions and combine them into a fresh revision set!`;
    }
  }

  return (
    <div className="bg-white border border-slate-150 rounded-3xl h-[580px] flex flex-col shadow-md overflow-hidden animate-slideUp">
      {/* Header */}
      <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full bg-emerald-450 animate-ping"></div>
          <div>
            <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-400 fill-current" />
              AI Copilot Coach
            </h3>
            <p className="text-[10px] text-slate-300">Tamil, English & Bilgual Support</p>
          </div>
        </div>

        <div className="flex items-center gap-2 select-none">
          {/* Lang buttons inside chat */}
          <div className="flex bg-slate-800 p-0.5 rounded-lg text-4xs font-bold ring-1 ring-white/10 text-slate-400">
            {(['english', 'tamil', 'bilingual'] as ExamLanguage[]).map(lng => (
              <button
                key={lng}
                onClick={() => setActiveLang(lng)}
                className={`px-1.5 py-0.5 rounded-md uppercase transition-all ${
                  activeLang === lng ? 'bg-indigo-650 text-white' : 'hover:text-white'
                }`}
              >
                {lng.slice(0, 2)}
              </button>
            ))}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Close chat panel"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 max-w-[85%] ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold select-none ${
              msg.sender === 'user' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-900 text-white'
            }`}>
              {msg.sender === 'user' ? <User className="h-4 w-4" /> : 'AI'}
            </div>

            {/* Bubble */}
            <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-3xs'
                : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-3xs'
            }`}>
              <p className="whitespace-pre-line">{msg.text}</p>
              <span className={`block text-[9px] mt-1.5 text-right ${
                msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
              }`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-2.5 max-w-[80%]">
            <div className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
              AI
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce delay-100"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce delay-200"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Suggested prompts list */}
      {currentDoubtQuestion && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-150/60 overflow-x-auto flex gap-2 scrollbar-none select-none shrink-0">
          <button
            onClick={() => handleSendMessage('Give me a real-world analogy for this question (உதாரணம் கொடுங்கள்)')}
            className="text-[10px] whitespace-nowrap bg-white hover:bg-slate-100 text-slate-650 px-2.5 py-1.5 rounded-lg border border-slate-205 font-semibold transition-colors flex items-center gap-1 shrink-0"
          >
            💡 Give Analogy
          </button>
          <button
            onClick={() => handleSendMessage('Break it down in simpler terms (எளிமையாக விளக்குங்கள்)')}
            className="text-[10px] whitespace-nowrap bg-white hover:bg-slate-100 text-slate-650 px-2.5 py-1.5 rounded-lg border border-slate-205 font-semibold transition-colors flex items-center gap-1 shrink-0"
          >
            🔍 Simplify Text
          </button>
          <button
            onClick={() => handleSendMessage('List 2 key formulas or facts to memorize (மனப்பாடம் செய்ய 2 முக்கிய விதிகள்)')}
            className="text-[10px] whitespace-nowrap bg-white hover:bg-slate-100 text-slate-650 px-2.5 py-1.5 rounded-lg border border-slate-205 font-semibold transition-colors flex items-center gap-1 shrink-0"
          >
            🔑 2 Facts to Memorize
          </button>
        </div>
      )}

      {/* Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="p-3 bg-white border-t border-slate-150 flex gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={activeLang === 'tamil' ? 'உங்கள் சந்தேகத்தைக் கேளுங்கள்...' : 'Ask your tutor a doubt about this question...'}
          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs outline-hidden focus:border-indigo-500 focus:bg-white text-slate-800"
          id="chat-input-text"
        />
        
        <button
          type="submit"
          disabled={!inputText.trim()}
          aria-label="Send message"
          title="Send message"
          className="h-8 w-8 rounded-xl bg-slate-900 hover:bg-black text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
