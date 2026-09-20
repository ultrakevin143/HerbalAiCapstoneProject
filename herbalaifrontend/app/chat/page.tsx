'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import SessionUnavailable from '../../components/SessionUnavailable';
import { cachedApiGet } from '../../lib/request-cache';
import { streamDrAiResponse } from '../../lib/dr-ai-stream';
import { Send, Sparkles, BookOpen, AlertCircle, ShieldAlert } from 'lucide-react';

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
  const { user, isAuthenticated, loading, sessionUnavailable, checkSession } = useAuth();
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

  // Check auth and redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated && !sessionUnavailable) {
      router.push(`/signin?callbackUrl=${encodeURIComponent('/chat')}`);
    }
  }, [loading, isAuthenticated, sessionUnavailable, router]);

  const handleSendQuery = React.useCallback(async (queryText: string) => {
    if (!queryText.trim() || isSending) return;

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
          <hr key={`rule-${lineIndex}`} className="my-3 border-0 border-t border-[#d8e8de] dark:border-line" />
        );
        lineIndex += 1;
        continue;
      }

      const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const sizeClass = level === 1 ? 'text-base' : 'text-sm';
        rendered.push(
          <h3 key={`heading-${lineIndex}`} className={`mt-3 mb-1.5 ${sizeClass} font-extrabold text-[#1b4332] dark:text-ink`}>
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
          <ul key={`unordered-${lineIndex}`} className="list-disc pl-5 my-2 space-y-1 font-sans text-sm text-[#1b4332] dark:text-ink">
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
          <ol key={`ordered-${lineIndex}`} className="list-decimal pl-5 my-2 space-y-1 font-sans text-sm text-[#1b4332] dark:text-ink">
            {items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}
          </ol>
        );
        continue;
      }

      if (trimmed.startsWith('⚠️')) {
        rendered.push(
          <div key={`warning-${lineIndex}`} className="my-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-800 dark:text-amber-200 font-sans leading-relaxed">
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
        <p key={`paragraph-${lineIndex}`} className="mb-2 font-sans text-sm leading-relaxed text-[#1b4332] dark:text-ink">
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
        parts.push(
          <strong key={keyIdx++} className="font-extrabold text-[#1b4332] dark:text-ink">
            {match[2]}
          </strong>
        );
      } else if (match[3]) {
        parts.push(<em key={keyIdx++} className="italic text-[#2d6a4f] dark:text-[#74c69d]">{match[4]}</em>);
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f0f7f2] dark:bg-canvas">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2d6a4f] border-t-transparent"></div>
        <p className="text-[#2d6a4f] dark:text-[#74c69d] font-extrabold animate-pulse font-sans">Connecting to Dr. AI...</p>
      </div>
    );
  }

  if (sessionUnavailable && !user) {
    return <SessionUnavailable retry={() => { void checkSession(true); }} />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left column: Bot Profile & Instructions */}
        <aside className="order-2 md:order-1 md:col-span-1 min-w-0 space-y-6">
          <div className="glass-card bg-white/50 dark:bg-panel/75 backdrop-blur-md border border-black/10 dark:border-line rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#40916c] to-[#74c69d] text-3xl flex items-center justify-center text-white shadow-sm mb-4">
              🤖
            </div>
            <h1 className="text-lg font-extrabold text-[#1b4332] dark:text-ink">Dr. AI Assistant</h1>
            <p className="text-xs text-[#2d6a4f] dark:text-[#74c69d] font-bold mt-1">● Online &amp; Verified</p>
            <p className="text-xs text-gray-500 dark:text-muted mt-3 leading-relaxed">
              Equipped with RAG technology to retrieve direct botanical records and FAQ resources from our secure databases.
            </p>
          </div>

          <div className="glass-card bg-white/40 dark:bg-panel/60 backdrop-blur-md border border-black/10 dark:border-line rounded-3xl p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-extrabold text-[#1b4332] dark:text-ink">Quick Reference Guides</h2>
            <div className="space-y-3 text-xs text-[#2d6a4f] dark:text-muted font-semibold">
              <div className="flex gap-2.5">
                <Sparkles className="h-4 w-4 shrink-0 text-[#40916c]" />
                <p>Specific preparation steps and recommended dosages.</p>
              </div>
              <div className="flex gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                <p>Safety warnings, side effects, and counter-indications.</p>
              </div>
              <div className="flex gap-2.5">
                <BookOpen className="h-4 w-4 shrink-0 text-[#40916c]" />
                <p>Interactive catalog links for citation verification.</p>
              </div>
            </div>
            <div className="border-t border-[#1b4332]/10 dark:border-line pt-4 text-[10px] text-gray-500 dark:text-muted leading-normal">
              <strong>Disclaimer:</strong> This content relies on traditional Philippine medicinal plant archives. It does not replace advice from licensed medical professionals.
            </div>
          </div>
        </aside>

        {/* Right column: Active Chat Box */}
        <section className="order-1 md:order-2 min-w-0 md:col-span-3 flex flex-col glass-card bg-white/55 dark:bg-panel/85 backdrop-blur-md border border-black/10 dark:border-line rounded-3xl overflow-hidden shadow-sm h-[calc(100dvh-8rem)] min-h-[450px] md:h-[650px]">
          {/* Header */}
          <header className="px-5 py-4 border-b border-black/10 dark:border-line flex items-center justify-between gap-2 bg-white/70 dark:bg-panel/90 shrink-0">
            <div>
              <h2 className="font-extrabold text-[#1b4332] dark:text-ink text-base">Consultation Session</h2>
              <p className="text-xs text-gray-600 dark:text-muted">Ask about plants, symptoms, or home preparation guidelines</p>
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
              className="text-xs text-[#2d6a4f] dark:text-[#74c69d] hover:underline font-bold"
            >
              Reset Chat
            </button>
          </header>

          {/* Message List Area */}
          <div ref={messageListRef} aria-label="Conversation messages" className="flex-1 overflow-y-auto p-6 space-y-4 bg-transparent">
            {/* Quick Prompts */}
            <div className="flex items-center flex-wrap gap-2 pb-2">
              <span className="text-[10px] font-bold text-gray-500 dark:text-muted uppercase tracking-wider mr-1">
                Suggested Prompts:
              </span>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isSending}
                  onClick={() => handleSendQuery(prompt)}
                  className="bg-white/80 dark:bg-soft border border-[#2d6a4f]/20 dark:border-line text-[#2d6a4f] dark:text-ink text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#eef5f0] dark:hover:bg-panel transition-all shadow-xs cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {messages.map((msg) => {
              const isBot = msg.role === 'model';
              return (
                <div key={msg.id} data-message-role={msg.role} data-message-id={msg.id} className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
                  {isBot && (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#40916c] to-[#74c69d] text-base flex items-center justify-center text-white shadow-sm shrink-0 mt-0.5">
                      🤖
                    </div>
                  )}

                  <div className="max-w-[85%] flex flex-col gap-1.5">
                    {/* Bubble */}
                    <div
                      className={`p-4 rounded-3xl ${
                        isBot
                          ? 'bg-white dark:bg-soft border border-gray-200/80 dark:border-line rounded-tl-sm text-[#1b4332] dark:text-ink shadow-sm'
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
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-muted font-extrabold mr-1">
                          Sources Cited:
                        </span>
                        {msg.sources.map((src, sIdx) => {
                          const normalizedTitle = src.title.toLowerCase().trim();
                          const matchedId = herbMap[normalizedTitle];

                          if (src.type === 'herb' && matchedId) {
                            return (
                              <button
                                key={sIdx}
                                onClick={() => router.push(`/library?id=${matchedId}`)}
                                className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#2d6a4f] dark:text-[#74c69d] bg-[#eef5f0] dark:bg-soft border border-[#2d6a4f]/25 dark:border-line px-2.5 py-0.5 rounded-full hover:bg-[#2d6a4f] hover:text-white transition-all cursor-pointer"
                              >
                                🌿 {src.title}
                              </button>
                            );
                          }

                          return (
                            <span
                              key={sIdx}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 dark:text-muted bg-gray-100 dark:bg-soft border border-gray-200 dark:border-line px-2 py-0.5 rounded-full"
                            >
                              📖 {src.title}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {!isBot && (
                    <div className="h-8 w-8 rounded-full bg-[#2d6a4f]/20 text-[#1b4332] dark:text-ink text-xs flex items-center justify-center font-extrabold shadow-sm border border-[#2d6a4f]/10 shrink-0 mt-0.5">
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

            {isSending && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#40916c] to-[#74c69d] text-base flex items-center justify-center text-white shadow-sm shrink-0">
                  🤖
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-soft border border-gray-200/80 dark:border-line text-xs font-semibold text-[#2d6a4f] dark:text-[#74c69d] flex items-center gap-2 shadow-sm">
                  <div className="h-2 w-2 rounded-full bg-[#40916c] animate-ping" />
                  <span>Dr. AI is researching verified herbal records...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-black/10 dark:border-line bg-white/70 dark:bg-panel/90 shrink-0">
            {chatError && (
              <div role="alert" className="mb-3 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{chatError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Dr. AI about Philippine medicinal plants, dosages, or warnings..."
                disabled={isSending}
                className="flex-1 bg-white dark:bg-soft border border-black/10 dark:border-line rounded-full px-5 py-3 text-sm text-[#1b4332] dark:text-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#40916c]"
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                className="h-11 w-11 rounded-full bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white flex items-center justify-center cursor-pointer hover:brightness-105 disabled:opacity-50 shadow-sm transition-all shrink-0"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

            <p className="text-[10px] text-gray-500 dark:text-muted mt-2 text-center">
              Disclaimer: Herbal AI references Philippine medicinal plant records and is intended for educational purposes only. Always consult a healthcare professional for medical conditions.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f0f7f2] dark:bg-canvas">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2d6a4f] border-t-transparent"></div>
          <p className="text-[#2d6a4f] font-extrabold animate-pulse font-sans">Loading Dr. AI...</p>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
