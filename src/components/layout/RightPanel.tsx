import React from 'react';
import { X } from 'lucide-react';

interface RightPanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const RightPanel: React.FC<RightPanelProps> = ({ isOpen, onClose, title, children }) => {
    return (
        <div
            className={`fixed top-16 right-0 bottom-0 z-40 w-[450px] transform border-l border-node-border bg-background shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
        >
            <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-node-border p-4">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-gray-400 hover:bg-node hover:text-white transition-colors"
                        title="Close panel"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default RightPanel;
