import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';

interface RightPanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const RightPanel: React.FC<RightPanelProps> = ({ isOpen, onClose, title, children }) => {
    const [width, setWidth] = useState(450);
    const isResizing = useRef(false);

    const startResizing = useCallback((e: React.MouseEvent) => {
        isResizing.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'col-resize';
    }, []);

    const stopResizing = useCallback(() => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'default';
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing.current) return;
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 300 && newWidth < window.innerWidth * 0.8) {
            setWidth(newWidth);
        }
    }, []);

    return (
        <div
            style={{ width: isOpen ? `${width}px` : 0 }}
            className={`fixed top-16 right-0 bottom-0 z-40 transform border-l border-node-border bg-background shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
        >
            {/* Resize Handle */}
            {isOpen && (
                <div
                    onMouseDown={startResizing}
                    className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cisco-blue/50 transition-colors group"
                >
                    <div className="absolute left-[-10px] top-1/2 transform -translate-y-1/2 bg-node-border border border-node-border rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical size={12} className="text-gray-400" />
                    </div>
                </div>
            )}

            <div className="flex h-full flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-node-border p-4 bg-node/20">
                    <h2 className="text-lg font-black uppercase italic tracking-tight">{title}</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-400 hover:bg-node hover:text-white transition-colors border border-transparent hover:border-node-border"
                        title="Close panel"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default RightPanel;
