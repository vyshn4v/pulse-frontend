import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  ArrowLeft,
  Send,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  Zap,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  Layers,
  Database,
} from 'lucide-react';

interface AiSourceCitation {
  type: string;
  id: number | string;
  title: string;
  snippet: string;
  timestamp?: string;
}

interface ChatMessage {
  id: string | number;
  role: 'user' | 'assistant';
  content: string;
  sources?: AiSourceCitation[];
  latencyMs?: number;
  modelUsed?: string;
  createdAt: string;
}

export const AiQuery: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('pulse_ai_chat_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    try {
      return localStorage.getItem('pulse_ai_selected_model') || 'auto';
    } catch {
      return 'auto';
    }
  });
  const [expandedSourcesId, setExpandedSourcesId] = useState<string | number | null>(null);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    '⚡ Summarize my engineering activities and LeetCode progress over the past 7 days.',
    '💼 Give me a status breakdown of my active job applications and interview stages.',
    '📢 Draft a technical LinkedIn post based on my recent problem solving and distributed systems work.',
    '🎯 What are the key bottlenecks or risks identified in my latest 5:00 AM Cognitive Synthesis?',
    '📝 Prepare my daily standup notes from yesterday\'s completed tasks.',
  ];

  // Save messages to localStorage whenever they update
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem('pulse_ai_chat_messages', JSON.stringify(messages));
      }
    } catch (err) {
      console.warn('Failed to persist chat messages to localStorage:', err);
    }
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/ai-query/history?limit=25', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const chatHistory: ChatMessage[] = [];
          data.reverse().forEach((log: any) => {
            chatHistory.push({
              id: `u-${log.id}`,
              role: 'user',
              content: log.query,
              createdAt: log.createdAt,
            });
            chatHistory.push({
              id: log.id,
              role: 'assistant',
              content: log.answer,
              sources: log.sources || [],
              latencyMs: log.latencyMs || 0,
              modelUsed: log.modelUsed || 'auto',
              createdAt: log.createdAt,
            });
          });
          setMessages(chatHistory);
          try {
            localStorage.setItem('pulse_ai_chat_messages', JSON.stringify(chatHistory));
          } catch {}
        }
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const text = (queryText || inputQuery).trim();
    if (!text || loading) return;

    const userMsgId = `u-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    const assistantMsgId = `asst-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      sources: [],
      latencyMs: 0,
      modelUsed: selectedModel,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-query/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          model: selectedModel,
        }),
        credentials: 'include',
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let streamedText = '';
        let currentSources: AiSourceCitation[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = 'message';
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('event: ')) {
              currentEvent = trimmed.slice(7).trim();
            } else if (trimmed.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmed.slice(6));
                if (currentEvent === 'sources') {
                  currentSources = data.sources || [];
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantMsgId ? { ...m, sources: currentSources } : m)),
                  );
                } else if (currentEvent === 'token') {
                  streamedText += data.token || '';
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantMsgId ? { ...m, content: streamedText } : m)),
                  );
                } else if (currentEvent === 'done') {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? {
                            ...m,
                            id: data.id || m.id,
                            content: data.answer || streamedText,
                            latencyMs: data.latencyMs,
                            modelUsed: data.modelUsed,
                          }
                        : m,
                    ),
                  );
                }
              } catch {}
            }
          }
        }
      } else {
        // Fallback to standard ask endpoint if stream not supported
        const resAsk = await fetch('/api/ai-query/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: text, model: selectedModel }),
          credentials: 'include',
        });

        if (resAsk.ok) {
          const responseData = await resAsk.json();
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    id: responseData.id,
                    role: 'assistant',
                    content: responseData.answer,
                    sources: responseData.sources || [],
                    latencyMs: responseData.latencyMs,
                    modelUsed: responseData.modelUsed,
                    createdAt: responseData.createdAt,
                  }
                : m,
            ),
          );
        } else {
          const errJson = await resAsk.json().catch(() => ({ message: resAsk.statusText }));
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: `⚠️ Error (${resAsk.status}): ${errJson.message || 'Failed to connect to AI Assistant. Please click Retry.'}`,
                  }
                : m,
            ),
          );
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: `⚠️ Network error: ${err.message}. Please click 🔄 Retry.`,
              }
            : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Clear all AI query conversation history?')) {
      try {
        await fetch('/api/ai-query/history', { method: 'DELETE', credentials: 'include' });
      } catch {}
      try {
        localStorage.removeItem('pulse_ai_chat_messages');
      } catch {}
      setMessages([]);
    }
  };

  const handleCopyText = (id: string | number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="activity-page" style={{ maxWidth: '1440px', margin: '0 auto', minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div className="page-header-left">
          <Link to="/" className="back-btn" title="Back to Instrument Panel">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="dashboard-subtitle">Semantic Assistant & Real-time Vector RAG</p>
            <h2>AI Query & Intelligence</h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="btn btn-sm btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Clear all conversation turns"
            >
              <Trash2 size={13} color="#e06c75" />
              <span>Clear History</span>
            </button>
          )}

          <button
            onClick={fetchHistory}
            className="btn btn-sm btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Reload grounding context"
          >
            <RefreshCw size={13} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Main Chat Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          marginBottom: '20px',
        }}
      >
        {/* Messages Scroll Area */}
        <div
          style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto',
            maxHeight: '62vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {initialLoading && messages.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px' }} />
              <p className="mono" style={{ fontSize: '0.85rem' }}>Loading semantic intelligence engine...</p>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', margin: 'auto', maxWidth: '640px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(232, 163, 61, 0.1)',
                  border: '1px solid var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Sparkles size={26} color="var(--accent)" />
              </div>
              <h3 style={{ margin: '0 0 8px', color: 'var(--text-bright)' }}>
                Ask PULSE Anything About Your Career & Engineering
              </h3>
              <p style={{ margin: '0 0 24px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Grounded in your real-time **Activity Logs**, **LeetCode Problem History**, **Job Pipeline Stages**, **LinkedIn Posts**, and **5:00 AM Syntheses**.
              </p>

              {/* Quick Prompt Starters */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Suggested Inquiries:
                </span>
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p)}
                    className="btn btn-sm btn-secondary"
                    style={{
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      padding: '10px 14px',
                      fontSize: '0.8rem',
                      lineHeight: '1.4',
                      background: 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <span>{p}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isExpanded = expandedSourcesId === msg.id;

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: isUser ? '80%' : '90%',
                    gap: '6px',
                  }}
                >
                  {/* Sender Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {isUser ? (
                      <>
                        <span>YOU</span>
                        <User size={12} color="var(--accent-2)" />
                      </>
                    ) : (
                      <>
                        <Bot size={12} color="var(--accent)" />
                        <span>PULSE AI ASSISTANT</span>
                        {msg.latencyMs ? (
                          <span style={{ color: 'var(--accent-2)' }}>⚡ {msg.latencyMs}ms</span>
                        ) : null}
                      </>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    style={{
                      background: isUser ? 'rgba(95, 168, 160, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isUser ? 'rgba(95, 168, 160, 0.3)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 20px',
                      lineHeight: '1.65',
                      fontSize: '0.88rem',
                      color: 'var(--text-bright)',
                      position: 'relative',
                    }}
                  >
                    {isUser ? (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    ) : (
                      <ReactMarkdown
                        components={{
                          h1: ({ node, ...props }) => (
                            <h3 style={{ color: 'var(--text-bright)', margin: '14px 0 8px', fontSize: '1.15rem' }} {...props} />
                          ),
                          h2: ({ node, ...props }) => (
                            <h4 style={{ color: 'var(--accent)', margin: '12px 0 6px', fontSize: '1.05rem' }} {...props} />
                          ),
                          h3: ({ node, ...props }) => (
                            <h5 style={{ color: 'var(--accent-2)', margin: '10px 0 6px', fontSize: '0.95rem', fontFamily: 'monospace' }} {...props} />
                          ),
                          p: ({ node, ...props }) => (
                            <p style={{ margin: '0 0 8px', lineHeight: '1.65' }} {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul style={{ margin: '4px 0 10px', paddingLeft: '20px' }} {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol style={{ margin: '4px 0 10px', paddingLeft: '20px' }} {...props} />
                          ),
                          li: ({ node, ...props }) => (
                            <li style={{ marginBottom: '5px', lineHeight: '1.55' }} {...props} />
                          ),
                          strong: ({ node, ...props }) => (
                            <strong style={{ color: 'var(--text-bright)', fontWeight: '600' }} {...props} />
                          ),
                          code: ({ node, ...props }: any) => (
                            <code style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--accent-2)', padding: '2px 5px', borderRadius: '4px', fontSize: '0.82rem', fontFamily: 'monospace' }} {...props} />
                          ),
                          blockquote: ({ node, ...props }) => (
                            <blockquote style={{ borderLeft: '3px solid var(--accent)', margin: '8px 0', paddingLeft: '12px', color: 'var(--text-muted)' }} {...props} />
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}

                    {/* Action Buttons (Retry + Copy) */}
                    {!isUser && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <button
                          onClick={() => {
                            const currentIdx = messages.findIndex((m) => m.id === msg.id);
                            if (currentIdx > 0 && messages[currentIdx - 1].role === 'user') {
                              handleSend(messages[currentIdx - 1].content);
                            }
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Retry query with AI"
                        >
                          <RefreshCw size={13} />
                        </button>

                        <button
                          onClick={() => handleCopyText(msg.id, msg.content)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Copy markdown text"
                        >
                          {copiedId === msg.id ? <Check size={13} color="var(--accent-2)" /> : <Copy size={13} />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Grounding Citations Drawer */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: '2px' }}>
                      <button
                        onClick={() => setExpandedSourcesId(isExpanded ? null : msg.id)}
                        className="btn btn-xs btn-secondary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.7rem',
                          fontFamily: 'monospace',
                          padding: '3px 8px',
                          color: 'var(--accent)',
                        }}
                      >
                        <Database size={11} />
                        <span>{msg.sources.length} Grounding Sources</span>
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      {isExpanded && (
                        <div
                          style={{
                            marginTop: '8px',
                            background: '#12161c',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          {msg.sources.map((s, sIdx) => (
                            <div
                              key={sIdx}
                              style={{
                                borderBottom: sIdx < msg.sources!.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                                paddingBottom: '6px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                <strong style={{ fontSize: '0.75rem', color: 'var(--accent-2)' }}>{s.title}</strong>
                                <span className="badge mono" style={{ fontSize: '0.65rem' }}>{s.type}</span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.snippet}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Loading Indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)' }}>
              <Bot size={16} className="spin" />
              <span className="mono" style={{ fontSize: '0.8rem' }}>
                Synthesizing semantic response over your operational history...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            padding: '16px 20px',
            background: 'var(--surface-hover)',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <textarea
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything about your tasks, LeetCode solutions, job applications, or syntheses (Shift+Enter for newline)..."
              rows={2}
              style={{
                width: '100%',
                background: 'var(--bg-main)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                color: 'var(--text-bright)',
                fontSize: '0.85rem',
                resize: 'none',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Model Engine:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedModel(val);
                    try {
                      localStorage.setItem('pulse_ai_selected_model', val);
                    } catch {}
                  }}
                  style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-bright)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.72rem',
                    padding: '2px 6px',
                    fontFamily: 'monospace',
                  }}
                >
                  <option value="auto">Auto / Multi-Provider RAG</option>
                  <option value="llama-3.3-70b">Llama 3.3 70B (OpenRouter/NIM)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="groq-llama">Groq Llama 3.3</option>
                </select>
              </div>

              <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Press <strong>Enter</strong> to ask
              </span>
            </div>
          </div>

          <button
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || loading}
            className="btn btn-primary"
            style={{
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: '46px',
            }}
          >
            <Send size={15} />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
