import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, PlusCircle, Shield, Globe, Terminal, Loader2 } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { AIGateway } from '../../lib/ai/aiGateway';
import { ConfigAgent } from '../../lib/ai/configAgent';
import { toast } from 'sonner';
import CLIBlock from './CLIBlock';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatPanel: React.FC = () => {
    const { activeSessionId, isLoading, startNewSession, addMessage, deleteSession, setLoading, getActiveSession } = useChatStore();
    const { nodes, edges, selectedNodeId, getDevice } = useNetworkStore();
    const { activeProvider } = useSettingsStore();

    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const activeSession = getActiveSession();

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activeSession?.messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        let sessionId = activeSessionId;
        if (!sessionId) {
            sessionId = startNewSession(selectedNodeId || undefined);
        }

        const userMsg = input.trim();
        setInput('');
        addMessage(sessionId, { role: 'user', content: userMsg });
        setLoading(true);

        try {
            // Build context
            const targetNode = selectedNodeId ? getDevice(selectedNodeId) : undefined;
            const history = activeSession?.messages || [];

            const topologySummary = `
Nodes: ${nodes.map(n => `${n.data.hostname} (${n.data.deviceType})`).join(', ')}
Edges: ${edges.map(e => `${e.source} -> ${e.target}`).join(', ')}
`.trim();

            // Create prompt
            let finalPrompt = '';
            if (targetNode) {
                finalPrompt = ConfigAgent.buildPrompt(userMsg, targetNode, history, topologySummary);
            } else {
                finalPrompt = `
You are a Network Assistant. Help the user with their topology or general queries.
Topology Summary: ${topologySummary}
User: ${userMsg}
`;
            }

            const response = await AIGateway.callAI({ prompt: finalPrompt });

            addMessage(sessionId, { role: 'assistant', content: response });
        } catch (error: any) {
            toast.error(`AI Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const renderContent = (content: string, nodeId?: string) => {
        const parts = content.split(/(```cli\n[\s\S]*?```)/g);

        return parts.map((part, idx) => {
            if (part.startsWith('```cli')) {
                const blocks = ConfigAgent.extractCLIBlocks(part);
                return blocks.map((b, bIdx) => (
                    <CLIBlock
                        key={`${idx}-${bIdx}`}
                        section={b.section}
                        commands={b.commands}
                        nodeId={nodeId}
                    />
                ));
            }
            return (
                <ReactMarkdown
                    key={idx}
                    remarkPlugins={[remarkGfm]}
                    className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed"
                >
                    {part}
                </ReactMarkdown>
            );
        });
    };

    return (
        <div className="flex h-full flex-col bg-background">
            {/* Session Controls */}
            <div className="flex items-center justify-between border-b border-node-border bg-node/10 p-4">
                <div className="flex items-center gap-3">
                    <Bot size={18} className="text-cisco-blue" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-white">AI Co-Pilot Hub</h2>
                    <div className="flex items-center gap-1 ml-2 bg-cisco-blue/10 px-2 py-0.5 rounded-full">
                        <span className="h-1 w-1 rounded-full bg-cisco-blue animate-pulse"></span>
                        <span className="text-[8px] font-black text-cisco-blue uppercase">{activeProvider}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => startNewSession(selectedNodeId || undefined)}
                        className="flex items-center gap-1.5 rounded-lg border border-node-border bg-node/50 px-3 py-1.5 text-[9px] font-black uppercase tracking-tight text-white hover:bg-node transition-all"
                    >
                        <PlusCircle size={12} />
                        New Thread
                    </button>
                    {activeSessionId && (
                        <button
                            onClick={() => deleteSession(activeSessionId)}
                            className="p-1.5 text-gray-600 hover:text-red-500 transition-colors"
                            title="Delete thread"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-auto p-6 space-y-8 custom-scrollbar"
            >
                {activeSession?.messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                        <div className="h-20 w-20 rounded-3xl bg-cisco-blue/5 border border-cisco-blue/20 flex items-center justify-center text-cisco-blue">
                            <Terminal size={40} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-black uppercase tracking-widest text-white">Ready for directives</p>
                            <p className="text-[10px] text-gray-500 font-medium max-w-[200px]">Select a node or ask a global question to begin orchestration.</p>
                        </div>
                    </div>
                )}

                {activeSession?.messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${msg.role === 'user' ? 'justify-end' : ''}`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cisco-blue text-white shadow-lg">
                                <Bot size={16} />
                            </div>
                        )}
                        <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                            <div className={`rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                                ? 'bg-cisco-blue text-white rounded-tr-none'
                                : 'bg-node/30 border border-node-border rounded-tl-none'
                                }`}>
                                {msg.role === 'assistant'
                                    ? renderContent(msg.content, activeSession.nodeId)
                                    : <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                                }
                            </div>
                            <span className="mt-2 text-[8px] font-black uppercase tracking-widest text-gray-600">
                                {msg.role === 'user' ? 'Local System' : `${activeProvider.toUpperCase()} AGENT`} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        {msg.role === 'user' && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-node-border text-gray-400">
                                <User size={16} />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-4 animate-pulse">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cisco-blue text-white">
                            <Bot size={16} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="h-10 w-64 rounded-2xl bg-node/30 rounded-tl-none border border-node-border flex items-center px-4">
                                <Loader2 size={14} className="animate-spin text-cisco-blue" />
                                <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-gray-500">Synthesizing CLI...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="border-t border-node-border bg-node/10 p-6">
                <div className="relative">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex items-end gap-3 rounded-2xl border border-node-border bg-background p-2 transition-all focus-within:border-cisco-blue focus-within:shadow-[0_0_20px_rgba(27,160,215,0.15)]"
                    >
                        <textarea
                            rows={1}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder={selectedNodeId ? `Command ${getDevice(selectedNodeId)?.hostname}...` : "Ask anything about the topology..."}
                            className="flex-1 resize-none bg-transparent px-2 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none custom-scrollbar max-h-32"
                        />
                        <button
                            disabled={!input.trim() || isLoading}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-cisco-blue text-white shadow-lg transition-all hover:opacity-90 disabled:bg-node-border disabled:text-gray-600 disabled:shadow-none"
                            title="Send message"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                    {selectedNodeId && (
                        <div className="absolute -top-3 left-4 flex items-center gap-1.5 rounded-full bg-cisco-blue px-2 py-0.5 shadow-lg border border-white/10">
                            <Terminal size={8} className="text-white" />
                            <span className="text-[7px] font-black uppercase tracking-tighter text-white">Focus: {getDevice(selectedNodeId)?.hostname}</span>
                        </div>
                    )}
                </div>
                <div className="mt-3 flex items-center justify-between">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity cursor-help">
                            <Shield size={10} className="text-green-500" />
                            <span className="text-[8px] font-black uppercase text-gray-500 tracking-tighter">Validation Layer: ON</span>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity cursor-help">
                            <Globe size={10} className="text-orange-500" />
                            <span className="text-[8px] font-black uppercase text-gray-500 tracking-tighter">Web Context: ENABLED</span>
                        </div>
                    </div>
                    <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest italic">SHIFT + ENTER FOR MULTILINE</p>
                </div>
            </div>
        </div>
    );
};

export default ChatPanel;
