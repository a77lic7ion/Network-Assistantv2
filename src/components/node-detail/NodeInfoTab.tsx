import React, { useState } from 'react';
import { Info, Settings, Cpu, HardDrive, Tag, Globe, Activity, FileText, Trash2 } from 'lucide-react';
import { DeviceNodeData } from '../../types';
import ConfigUploader from './ConfigUploader';
import { useNetworkStore } from '../../store/useNetworkStore';
import { ConfigTabParser } from '../../parsers/configTabParser';
import { toast } from 'sonner';

interface NodeInfoTabProps {
    device: DeviceNodeData;
    id: string;
}

const NodeInfoTab: React.FC<NodeInfoTabProps> = ({ device, id }) => {
    const updateDevice = useNetworkStore((state) => state.updateDevice);
    const autoConnectNodes = useNetworkStore((state) => state.autoConnectNodes);
    const appendToRunningConfig = useNetworkStore((state) => state.appendToRunningConfig);
    const removeDevice = useNetworkStore((state) => state.removeDevice);

    const handleUpdate = (field: keyof DeviceNodeData, value: string) => {
        updateDevice(id, { [field]: value });
    };

    const handleConfigUpload = (uploadedDeviceId: string, rawContent: string) => {
        // If content is empty (cleared), clear the device config
        if (!rawContent) {
            updateDevice(uploadedDeviceId, {
                blankConfigContext: '',
                runningConfig: '',
                configBlockCount: 0
            });
            return;
        }

        const parsed = ConfigTabParser.parse(rawContent);
        
        // 1. Update basic info and blank config context
        updateDevice(uploadedDeviceId, {
            blankConfigContext: rawContent, 
            deviceModel: parsed.hardwareModel || device.deviceModel,
            softwareVersion: parsed.osVersion || device.softwareVersion,
            hostname: parsed.hostname || device.hostname,
            managementIp: parsed.managementIp || device.managementIp,
            // 2. IMPORTANT: Force update runningConfig immediately with the raw content
            // This ensures InterfacesTab receives the data instantly without waiting for 'Apply Config'
            runningConfig: rawContent
        });
        
        // 3. Trigger auto-connection logic
        autoConnectNodes(uploadedDeviceId);
        
        toast.success('Configuration applied successfully');
    };

    const fields = [
        { key: 'hostname', label: 'Hostname', icon: Tag },
        { key: 'managementIp', label: 'Management IP', icon: Globe },
        { key: 'deviceModel', label: 'Device Model', icon: HardDrive },
        { key: 'softwareVersion', label: 'Software Version', icon: Activity },
    ];

    return (
        <div className="p-6 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 gap-6">
                {fields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                        <div className="flex items-center gap-2 mb-1">
                            <field.icon size={12} className="text-cisco-blue" />
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">{field.label}</label>
                        </div>
                        <input
                            type="text"
                            value={(device as any)[field.key]}
                            onChange={(e) => handleUpdate(field.key as keyof DeviceNodeData, e.target.value)}
                            className="w-full rounded-xl border border-node-border bg-node/30 px-4 py-3 text-sm font-bold text-white transition-all focus:border-cisco-blue focus:outline-none focus:ring-1 focus:ring-cisco-blue/50"
                        />
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t border-node-border">
                <div className="flex items-center gap-2 mb-4">
                    <Settings size={14} className="text-cisco-blue" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">Hardware Context Layer</h4>
                </div>
                <ConfigUploader
                    onUpload={handleConfigUpload}
                    fileName={device.blankConfigContext ? 'Active hardware context present' : undefined}
                    deviceId={id}
                />
                {device.blankConfigContext && (
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 rounded-lg bg-node p-3 border border-node-border flex-1">
                            <FileText size={14} className="text-cisco-blue" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex-1">Raw Context Active</span>
                            <button
                            onClick={() => {
                                updateDevice(id, { blankConfigContext: '', runningConfig: '' });
                                toast.success('Device configuration cleared');
                            }}
                            className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest"
                        >
                            Clear
                        </button>
                        </div>
                        <button
                            onClick={() => appendToRunningConfig(id, device.blankConfigContext)}
                            className="ml-2 px-4 py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors"
                        >
                            Apply Config
                        </button>
                        <button
                            onClick={() => {
                                toast.custom((t) => (
                                    <div className="bg-node p-4 rounded-lg shadow-lg flex items-center gap-4">
                                        <p className="text-white text-sm">Are you sure you want to delete this device?</p>
                                        <button
                                            onClick={() => {
                                                removeDevice(id);
                                                toast.dismiss(t);
                                                toast.success(`${device.hostname} deleted successfully.`);
                                            }}
                                            className="px-3 py-2 bg-red-600 text-white rounded-md text-xs font-bold hover:bg-red-700 transition-colors"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={() => toast.dismiss(t)}
                                            className="px-3 py-2 bg-gray-600 text-white rounded-md text-xs font-bold hover:bg-gray-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ), { duration: Infinity });
                            }}
                            className="ml-2 px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
                            title="Delete Device"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
                {device.blankConfigContext && (
                    <div className="mt-4 rounded-xl border border-node-border bg-[#0d1117] p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black uppercase text-gray-600">Preview (First 200 chars)</span>
                        </div>
                        <pre className="text-[10px] text-gray-400 font-mono truncate whitespace-pre overflow-hidden bg-black/30 p-2 rounded">
                            {device.blankConfigContext.slice(0, 200)}...
                        </pre>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-cisco-blue/5 p-4 border border-cisco-blue/10">
                <Info size={16} className="text-cisco-blue" />
                <p className="text-[10px] text-gray-400 leading-relaxed italic">
                    Changes here update the <span className="text-white font-bold">Source of Truth</span> immediately. All downstream agents will observe these updates in their next turn.
                </p>
            </div>
        </div>
    );
};

export default NodeInfoTab;
