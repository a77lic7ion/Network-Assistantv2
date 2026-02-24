import React, { useCallback, useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { ConfigTabParser } from '../../parsers/configTabParser';

interface ConfigUploaderProps {
    onUpload: (deviceId: string, rawContent: string) => void;
    fileName?: string;
    deviceId: string;
}

const ConfigUploader: React.FC<ConfigUploaderProps> = ({ onUpload, fileName, deviceId }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [currentFile, setCurrentFile] = useState<string | null>(fileName || null);

    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const rawContent = e.target?.result as string;
            // Pass the deviceId and rawContent to the parent callback
            // The parent (NodeInfoTab) will handle updateDevice and appendToRunningConfig
            onUpload(deviceId, rawContent);
            setCurrentFile(file.name);
        };
        // Rule 10: Use FileReader.readAsText()
        reader.readAsText(file);
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, []);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div className="space-y-3">
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all ${isDragging
                    ? 'border-cisco-blue bg-cisco-blue/5'
                    : currentFile ? 'border-green-500/30 bg-green-500/5' : 'border-node-border bg-node/30 hover:border-gray-600'
                    }`}
            >
                <input
                    type="file"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    accept=".txt,.cfg,.log,.config"
                    onChange={onChange}
                />

                {currentFile ? (
                    <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20 text-green-500 mb-3">
                            <CheckCircle2 size={24} />
                        </div>
                        <p className="text-sm font-bold text-white mb-1">Context Uploaded</p>
                        <p className="text-[10px] text-gray-500 font-mono truncate max-w-full italic px-4">{currentFile}</p>
                    </>
                ) : (
                    <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-node-border text-gray-400 mb-3">
                            <Upload size={24} />
                        </div>
                        <p className="text-sm font-bold text-white mb-1">Hardware Context</p>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider text-center px-4 leading-relaxed">
                            Drag & Drop blank config tab<br />or click to browse (.txt, .cfg)
                        </p>
                    </>
                )}
            </div>

            {currentFile && (
                <div className="flex items-center gap-2 rounded-lg bg-node p-3 border border-node-border">
                    <FileText size={14} className="text-cisco-blue" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex-1">Raw Context Active</span>
                    <button
                        onClick={() => {
                            setCurrentFile(null);
                            onUpload(deviceId, ''); // Clear the config
                        }}
                        className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest"
                    >
                        Clear
                    </button>
                </div>
            )}
        </div>
    );
};

export default ConfigUploader;
