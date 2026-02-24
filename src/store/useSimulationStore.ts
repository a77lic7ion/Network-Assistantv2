import { create } from 'zustand';
import { PingResult } from '../types';

interface SimulationState {
    lastResult: PingResult | null;
    history: PingResult[];
    isSimulating: boolean;

    setLastResult: (result: PingResult | null) => void;
    addResultToHistory: (result: PingResult) => void;
    setSimulating: (isSimulating: boolean) => void;
    clearHistory: () => void;
}

// Note: Per user request, simulation results ARE NOT persisted.
export const useSimulationStore = create<SimulationState>((set) => ({
    lastResult: null,
    history: [],
    isSimulating: false,

    setLastResult: (result) => set({ lastResult: result }),
    addResultToHistory: (result) => set((state) => ({ history: [result, ...state.history] })),
    setSimulating: (isSimulating) => set({ isSimulating }),
    clearHistory: () => set({ history: [] }),
}));
