import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIMessage, CLIBlock } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ChatSession {
    id: string;
    nodeId?: string; // If specific to a node, otherwise global
    messages: AIMessage[];
    timestamp: number;
}

interface ChatState {
    sessions: ChatSession[];
    activeSessionId: string | null;
    isLoading: boolean;

    startNewSession: (nodeId?: string) => string;
    addMessage: (sessionId: string, message: AIMessage) => void;
    deleteSession: (id: string) => void;
    setLoading: (loading: boolean) => void;
    getActiveSession: () => ChatSession | undefined;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            sessions: [],
            activeSessionId: null,
            isLoading: false,

            startNewSession: (nodeId) => {
                const id = uuidv4();
                const newSession: ChatSession = {
                    id,
                    nodeId,
                    messages: [],
                    timestamp: Date.now(),
                };
                set((state) => ({
                    sessions: [newSession, ...state.sessions],
                    activeSessionId: id,
                }));
                return id;
            },

            addMessage: (sessionId, message) =>
                set((state) => ({
                    sessions: state.sessions.map((s) =>
                        s.id === sessionId
                            ? { ...s, messages: [...s.messages, message], timestamp: Date.now() }
                            : s
                    ),
                })),

            deleteSession: (id) =>
                set((state) => ({
                    sessions: state.sessions.filter((s) => s.id !== id),
                    activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
                })),

            setLoading: (loading) => set({ isLoading: loading }),

            getActiveSession: () => {
                const { sessions, activeSessionId } = get();
                return sessions.find((s) => s.id === activeSessionId);
            },
        }),
        {
            name: 'netlab-chat-storage',
        }
    )
);
