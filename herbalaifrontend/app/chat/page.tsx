'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { cachedApiGet } from '../../lib/request-cache';
import { streamDrAiResponse } from '../../lib/dr-ai-stream';
import { Send, Sparkles, BookOpen, AlertCircle } from 'lucide-react';

interface ChatTurn {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface Source {
  type: 'herb' | 'kb';
  title: string;
  distance?: number;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: Source[];
}

interface HerbInfo {
  id: string;
  localName: string;
}

const QUICK_PROMPTS = [
  'What are the medicinal uses of Lagundi?',
  'How is Sambong traditionally prepared?',
  'What safety warnings apply to Bayabas leaves?',
] as const;

function ChatContent() {
  const { user, isAuthenticated, loading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I am Dr. AI, your Philippine traditional herbal medicine assistant. I can guide you on the medicinal uses, preparation methods, dosages, and warnings for local plants based on our verified database. How can I help you today?\n\n*Example queries:*\n- *How do I prepare lagundi for cough?*\n- *What are the uses of sambong?*\n- *Are there any warnings for bayabas leaves?*",
    },
  ]);
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [herbMap, setHerbMap] = useState<Record<string, string>>({}); // Maps lowercase localName to herb.id

  const messageListRef = useRef<HTMLDivElement>(null);
  const processedInitialQuery = useRef(false);

  // Fetch herbs to map local name to ID for source linking
  useEffect(() => {
    const fetchHerbs = async () => {
      try {
        const res = await cachedApiGet('/herbs', 60_000);
        if (res.data?.status === 'success') {
          const list = res.data.data.herbs || [];
          const mapping: Record<string, string> = {};
          list.forEach((h: HerbInfo) => {
            mapping[h.localName.toLowerCase().trim()] = h.id;
          });
          setHerbMap(mapping);
        }
      } catch (err) {
        console.error('Failed to pre-fetch herb catalog details:', err);
      }
    };

    if (isAuthenticated) {
      fetchHerbs();
    }
  }, [isAuthenticated]);

  // Handle auto-scroll to bottom of conversation
  useEffect(() => {
    const messageList = messageListRef.current;
    messageList?.scrollTo({ top: messageList.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  // Check auth and redirect if not authenticated (as secondary defense to middleware)
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(`/signin?callbackUrl=${encodeURIComponent('/chat')}`);
    }
  }, [loading, isAuthenticated, router]);



  const handleSendQuery = React.useCallback(async (queryText: string) => {
    if (!queryText.trim() || isSending) return;

    // Add user message
    const userMsgId = Date.now().toString();
    const newMsg: Message = {
      id: userMsgId,
      role: 'user',
      text: queryText,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    setIsSending(true);
    setChatError(null);

    // Build the payload history. Exclude the initial welcome message from Gemini context if needed,
    // or send the entire history context.
    const cleanHistory = [...history];

    try {
      const modelMessageId = `${userMsgId}-model`;
      let reply = '';
      let sources: Source[] = [];
      let modelMessageAdded = false;

      await streamDrAiResponse(queryText, cleanHistory, ({ event, data }) => {
        if (event === 'sources') {
          sources = data.sources;
          return;
        }
        if (event === 'chunk') {
          reply += data.text;
          if (!modelMessageAdded) {
            modelMessageAdded = true;
            setMessages((prev) => [...prev, { id: modelMessageId, role: 'model', text: reply, sources }]);
          } else {
            setMessages((prev) => prev.map((message) =>
              message.id === modelMessageId ? { ...message, text: reply, sources } : message
            ));
          }
          return;
        }
        if (event === 'done') {
          sources = data.sources || sources;
          setHistory(data.history || []);
          setMessages((prev) => prev.map((message) =>
            message.id === modelMessageId ? { ...message, sources } : message
          ));
        }
      });
    } catch (err: unknown) {
      setChatError(err instanceof Error ? err.message : 'Connection lost. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [history, isSending]);

  // Process initial query from homepage widget if present
  useEffect(() => {
    if (processedInitialQuery.current || !isAuthenticated) return;
    const initialQ = searchParams.get('q');
    if (initialQ?.trim()) {
      processedInitialQuery.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleSendQuery(initialQ.trim());
    }
  }, [searchParams, isAuthenticated, handleSendQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendQuery(input);
  };

  // Render the small, predictable Markdown subset returned by Dr. AI without
  // allowing raw HTML. Parsing line-by-line keeps headings and lists separate
  // even when the model places them in the same paragraph block.
  const renderFormattedText = (text: string) => {
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    const rendered: React.ReactNode[] = [];
    const horizontalRulePattern = /^(?:-{3,}|\*{3,}|_{3,})$/;
    let lineIndex = 0;

    while (lineIndex < lines.length) {
      const trimmed = lines[lineIndex].trim();

      if (!trimmed) {
        lineIndex += 1;
        continue;
      }

      if (horizontalRulePattern.test(trimmed)) {
        rendered.push(
          <hr key={`rule-${lineIndex}`} className="my-3 border-0 border-t border-[#d8e8de]" />
        );
        lineIndex += 1;
        continue;
      }

      const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const sizeClass = level === 1 ? 'text-base' : 'text-sm';
        rendered.push(
          <h3 key={`heading-${lineIndex}`} className={`mt-3 mb-1.5 ${sizeClass} font-extrabold text-[#1b4332]`}>
            {renderInline(headingMatch[2].trim())}
          </h3>
        );
        lineIndex += 1;
        continue;
      }

      if (/^[-*]\s+/.test(trimmed)) {
        const items: string[] = [];
        while (lineIndex < lines.length && /^[-*]\s+/.test(lines[lineIndex].trim())) {
          items.push(lines[lineIndex].trim().replace(/^[-*]\s+/, ''));
          lineIndex += 1;
        }
        rendered.push(
          <ul key={`unordered-${lineIndex}`} className="list-disc pl-5 my-2 space-y-1 font-sans text-sm text-[#1b4332]">
            {items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}
          </ul>
        );
        continue;
      }

      if (/^\d+\.\s+/.test(trimmed)) {
        const items: string[] = [];
        while (lineIndex < lines.length && /^\d+\.\s+/.test(lines[lineIndex].trim())) {
          items.push(lines[lineIndex].trim().replace(/^\d+\.\s+/, ''));
          lineIndex += 1;
        }
        rendered.push(
          <ol key={`ordered-${lineIndex}`} className="list-decimal pl-5 my-2 space-y-1 font-sans text-sm text-[#1b4332]">
            {items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}
          </ol>
        );
        continue;
      }

      if (trimmed.startsWith('⚠️')) {
        rendered.push(
          <div key={`warning-${lineIndex}`} className="my-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-sans leading-relaxed">
            {renderInline(trimmed)}
          </div>
        );
        lineIndex += 1;
        continue;
      }

      const paragraphLines: string[] = [];
      while (lineIndex < lines.length) {
        const candidate = lines[lineIndex].trim();
        if (!candidate || horizontalRulePattern.test(candidate) || /^(#{1,3})\s+/.test(candidate) || /^[-*]\s+/.test(candidate) || /^\d+\.\s+/.test(candidate)) {
          break;
        }
        paragraphLines.push(candidate);
        lineIndex += 1;
      }

      rendered.push(
        <p key={`paragraph-${lineIndex}`} className="mb-2 font-sans text-sm leading-relaxed text-[#1b4332]">
          {renderInline(paragraphLines.join(' '))}
        </p>
      );
    }

    return rendered;
  };

  const renderInline = (text: string) => {
    const parts: React.ReactNode[] = [];
    const pattern = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3/g;
    let match;
    let lastIndex = 0;
    let keyIdx = 0;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      if (match[1]) {
        // Bold
        parts.push(
          <strong key={keyIdx++} className="font-extrabold text-[#1b4332]">
            {match[2]}
          </strong>
        );
      } else if (match[3]) {
        // Italic
        parts.push(<em key={keyIdx++} className="italic text-[#2d6a4f]">{match[4]}</em>);
      }

      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f0f7f2]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2d6a4f] border-t-transparent"></div>
        <p className="text-[#2d6a4f] font-extrabold animate-pulse font-sans">Connecting to Dr. AI...</p>
      </div>
    );
  }

  if (!user) {
    return null; // redirecting
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfdfa] font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Left column: Bot Profile & Instructions */}
        <aside className="order-2 md:order-1 md:col-span-1 min-w-0 space-y-6">
          <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#40916c] to-[#74c69d] text-3xl flex items-center justify-center text-white shadow-sm mb-4">
              🤖
            </div>
            <h1 className="text-lg font-extrabold text-[#1b4332]">Dr. AI Assistant</h1>
            <p className="text-xs text-[#2d6a4f] font-bold mt-1">● Online & Verified</p>
            <p className="text-xs text-gray-500 mt-3 leading-relaxed">
              Equipped with RAG technology to retrieve direct botanical records and FAQ resources from our secure databases.
            </p>
          </div>

          <div className="bg-[#eef5f0]/50 border border-[#2d6a4f]/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-extrabold text-[#1b4332]">Quick Reference Guides</h2>
            <div className="space-y-3 text-xs text-[#2d6a4f] font-semibold">
              <div className="flex gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-[#40916c]" />
                <p>Specific preparation steps and recommended dosages.</p>
              </div>
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                <p>Safety warnings, side effects, and counter-indications.</p>
              </div>
              <div className="flex gap-2">
                <BookOpen className="h-4 w-4 shrink-0 text-[#40916c]" />
                <p>Interactive catalog links for citation verification.</p>
              </div>
            </div>
            <div className="border-t border-[#1b4332]/10 pt-4 text-[10px] text-gray-500 leading-normal">
              <strong>Disclaimer:</strong> This content relies on traditional Philippine medicinal plant archives. It does not replace advice from licensed medical professionals.
            </div>
          </div>
        </aside>

        {/* Right column: Active Chat Box */}
        <section className="order-1 md:order-2 min-w-0 md:col-span-3 flex flex-col bg-white border border-black/10 rounded-3xl overflow-hidden shadow-sm h-[calc(100dvh-8rem)] min-h-[400px] md:h-[650px]">

          {/* Header */}
          <header className="px-4 py-3 border-b border-black/10 flex items-center justify-between gap-2 bg-white shrink-0">
            <div>
              <h2 className="font-extrabold text-[#1b4332] text-base">Consultation Session</h2>
              <p className="text-xs text-gray-600">Ask about plants, symptoms, or home preparation guidelines</p>
            </div>
            <button
              onClick={() => {
                setMessages([
                  {
                    id: 'welcome',
                    role: 'model',
                    text: "Hello! I am Dr. AI, your Philippine traditional herbal medicine assistant. I can guide you on the medicinal uses, preparation methods, dosages, and warnings for local plants based on our verified database. How can I help you today?",
                  }
                ]);
                setHistory([]);
                setChatError(null);
              }}
              className="text-xs text-[#2d6a4f] hover:underline font-bold"
            >
              Reset Chat
            </button>
          </header>

          {/* Message List Area */}
          <div ref={messageListRef} aria-label="Conversation messages" className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
            {messages.map((msg) => {
              const isBot = msg.role === 'model';
              return (
                <div key={msg.id} data-message-role={msg.role} data-message-id={msg.id} className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
                  {isBot && (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#40916c] to-[#74c69d] text-base flex items-center justify-center text-white shadow-sm shrink-0">
                      🤖
                    </div>
                  )}

                  <div className="max-w-[85%] flex flex-col gap-1.5">
                    {/* Bubble */}
                    <div
                      className={`p-4 rounded-3xl ${isBot
                          ? 'bg-white border border-gray-200/80 rounded-tl-sm text-[#1b4332]'
                          : 'bg-gradient-to-br from-[#40916c] to-[#52b788] text-white rounded-tr-sm shadow-sm'
                        }`}
                    >
                      {isBot ? (
                        renderFormattedText(msg.text)
                      ) : (
                        <p className="text-sm font-semibold leading-relaxed font-sans">{msg.text}</p>
                      )}
                    </div>

                    {/* Sources (Bot only) */}
                    {isBot && msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-wrap gap-2 px-2 mt-1 items-center">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-extrabold mr-1">Sources Cited:</span>
                        {msg.sources.map((src, sIdx) => {
                          const normalizedTitle = src.title.toLowerCase().trim();
                          const matchedId = herbMap[normalizedTitle];

                          if (src.type === 'herb' && matchedId) {
                            return (
                              <button
                                key={sIdx}
                                onClick={() => router.push(`/library?id=${matchedId}`)}
                                className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#2d6a4f] bg-[#eef5f0] border border-[#2d6a4f]/25 px-2 py-0.5 rounded-full hover:bg-[#2d6a4f] hover:text-white transition-all cursor-pointer"
                              >
                                🌿 {src.title}
                              </button>
                            );
                          }

                          return (
                            <span
                              key={sIdx}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full"
                            >
                              📖 {src.title}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {!isBot && (
                    <div className="h-8 w-8 rounded-full bg-[#2d6a4f]/20 text-[#1b4332] text-xs flex items-center justify-center font-extrabold shadow-sm border border-[#2d6a4f]/10 shrink-0">
                      {user?.avatar?.startsWith('http') ? (
                        <img src={user.avatar} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <span>{user?.avatar || '🌱'}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading / Typing State */}
            {isSending && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#40916c] to-[#74c69d] text-base flex items-center justify-center text-white shadow-sm shrink-0">
                  🤖
                </div>
                <div className="p-4 rounded-3xl bg-white border border-gray-200/80 rounded-tl-sm flex items-center gap-1.5 h-11">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#40916c] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#40916c] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#40916c] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {chatError && (
              <div className="flex gap-2 p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-bold items-center shadow-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{chatError}</span>
              </div>
            )}

          </div>

          {/* Form Input Footer */}
          <div className="border-t border-black/10 bg-white p-3 shrink-0">
            <div aria-label="Quick prompts" className="mb-2 flex gap-2 overflow-x-auto pb-1" role="group" tabIndex={0}>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isSending}
                  onClick={() => handleSendQuery(prompt)}
                  className="shrink-0 rounded-full border border-[#2d6a4f]/30 bg-[#eef5f0] px-3 py-1.5 text-xs font-bold text-[#1b4332] hover:bg-[#dceee2] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder={isSending ? "Waiting for response..." : "Type your query here..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSending}
              className="min-w-0 flex-1 px-4 py-3 border border-gray-200 bg-gray-50/50 text-base rounded-full text-[#1b4332] placeholder-emerald-800/40 focus:outline-none focus:border-[#2d6a4f] focus:bg-white transition-all disabled:opacity-50 font-sans"
              aria-label="Type message"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-[#40916c] to-[#74c69d] text-white flex items-center justify-center shadow-sm hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Send message"
            >
              <Send className="h-5 w-5 rotate-0 pl-0.5" />
            </button>
          </form>
          </div>

        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f0f7f2]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2d6a4f] border-t-transparent"></div>
        <p className="text-[#2d6a4f] font-extrabold animate-pulse font-sans">Loading page context...</p>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
