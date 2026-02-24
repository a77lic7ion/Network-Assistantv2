import React, { useState, useEffect } from 'react';
import { X, Upload, Info, Cpu, Network, Router, Wifi, Server, Zap } from 'lucide-react';
import { DeviceNodeData, DeviceType, Vendor } from '../../types';
import { ConfigTabParser } from '../../parsers/configTabParser';

interface DeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<DeviceNodeData>) => void;
    initialData?: Partial<DeviceNodeData>;
    isCore?: boolean;
}

const DeviceModal: React.FC<DeviceModalProps> = ({ isOpen, onClose, onSubmit, initialData, isCore = false }) => {
    const [formData, setFormData] = useState<Partial<DeviceNodeData>>({
        hostname: '',
        managementIp: '',
        vendor: 'cisco',
        deviceModel: '',
        softwareVersion: '',
        deviceType: 'switch',
        isCore: isCore,
        macAddress: '',
        serialNumber: '',
        status: 'OK',
        activeInterfacesCount: 0,
        ...initialData
    });
    const [availableIps, setAvailableIps] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                hostname: '',
                managementIp: '',
                vendor: 'cisco',
                deviceModel: '',
                softwareVersion: '',
                deviceType: 'switch',
                isCore: isCore,
                macAddress: '',
                serialNumber: '',
                status: 'OK',
                activeInterfacesCount: 0,
                ...initialData
            });
            setAvailableIps([]);
        }
    }, [isOpen, initialData, isCore]);

    if (!isOpen) return null;

    const handleConfigUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const parsed = ConfigTabParser.parse(content) as any;
            
            setFormData(prev => ({
                ...prev,
                hostname: parsed.hostname || prev.hostname,
                managementIp: parsed.managementIp || prev.managementIp,
                deviceModel: parsed.hardwareModel || prev.deviceModel,
                softwareVersion: parsed.osVersion || prev.softwareVersion,
                blankConfigContext: content,
                macAddress: parsed.macAddress || prev.macAddress,
                serialNumber: parsed.serialNumber || prev.serialNumber,
                activeInterfacesCount: parsed.interfaces?.length || 0,
                status: 'OK',
                configuredDate: new Date().toISOString().split('T')[0]
            }));
            
            if (parsed.allIps && parsed.allIps.length > 0) {
                setAvailableIps(parsed.allIps);
            }
        };
        reader.readAsText(file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Ensure that if a config was uploaded, it is applied to runningConfig as well
        const finalData = {
            ...formData,
            runningConfig: formData.blankConfigContext || formData.runningConfig || ''
        };
        
        onSubmit(finalData);
        onClose();
    };

    const deviceTypes: { value: DeviceType; label: string; icon: any }[] = [
        { value: 'switch', label: 'Switch', icon: Network },
        { value: 'router', label: 'Router', icon: Router },
        { value: 'firewall', label: 'Firewall', icon: Cpu },
        { value: 'ap', label: 'Access Point', icon: Wifi },
        { value: 'server', label: 'Server/Host', icon: Server },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-node-border bg-background shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between border-b border-node-border p-6 bg-node/50">
                    <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isCore ? 'bg-core-accent text-black' : 'bg-cisco-blue text-white'}`}>
                            <Plus size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{isCore ? 'Initialize CORE Network' : (initialData ? 'Edit Device' : 'Add New Device')}</h2>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">{isCore ? 'Phase 1: Foundation Layer' : 'Expand Network Topology'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-node hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5 ml-1">Hostname</label>
                                <input
                                    autoFocus
                                    required
                                    placeholder="e.g. SW-CORE-01"
                                    className="w-full rounded-lg border border-node-border bg-node px-4 py-2.5 text-sm font-medium text-white placeholder:text-gray-600 focus:border-cisco-blue focus:outline-none focus:ring-1 focus:ring-cisco-blue"
                                    value={formData.hostname}
                                    onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5 ml-1">Management IP</label>
                                <div className="flex gap-2">
                                    <input
                                        required
                                        placeholder="e.g. 192.168.1.1/24"
                                        className="flex-1 rounded-lg border border-node-border bg-node px-4 py-2.5 text-sm font-medium text-white placeholder:text-gray-600 focus:border-cisco-blue focus:outline-none focus:ring-1 focus:ring-cisco-blue"
                                        value={formData.managementIp}
                                        onChange={(e) => setFormData({ ...formData, managementIp: e.target.value })}
                                    />
                                    {availableIps.length > 0 && (
                                        <select
                                            className="w-32 rounded-lg border border-node-border bg-node px-2 py-2.5 text-[10px] font-bold uppercase text-cisco-blue focus:border-cisco-blue focus:outline-none"
                                            onChange={(e) => setFormData({ ...formData, managementIp: e.target.value })}
                                            value=""
                                        >
                                            <option value="" disabled>Detected</option>
                                            {availableIps.map(ip => (
                                                <option key={ip} value={ip}>{ip}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5 ml-1">Device Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {deviceTypes.map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, deviceType: type.value })}
                                            className={`flex flex-col items-center justify-center gap-1 rounded-lg border p-2 py-3 transition-all ${formData.deviceType === type.value
                                                    ? 'border-cisco-blue bg-cisco-blue/10 text-cisco-blue'
                                                    : 'border-node-border bg-node text-gray-400 hover:border-gray-600 hover:text-white'
                                                }`}
                                        >
                                            <type.icon size={18} />
                                            <span className="text-[10px] font-bold uppercase">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 text-white">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5 ml-1">Vendor</label>
                                    <select
                                        className="w-full rounded-lg border border-node-border bg-node px-3 py-2.5 text-sm font-medium focus:border-cisco-blue focus:outline-none focus:ring-1 focus:ring-cisco-blue"
                                        value={formData.vendor}
                                        onChange={(e) => setFormData({ ...formData, vendor: e.target.value as Vendor })}
                                    >
                                        <option value="cisco">Cisco</option>
                                        <option value="juniper">Juniper</option>
                                        <option value="arista">Arista</option>
                                        <option value="hp">HP</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5 ml-1">Device Model</label>
                                <input
                                    placeholder="e.g. Catalyst 9300L"
                                    className="w-full rounded-lg border border-node-border bg-node px-4 py-2.5 text-sm font-medium text-white placeholder:text-gray-600 focus:border-cisco-blue focus:outline-none focus:ring-1 focus:ring-cisco-blue"
                                    value={formData.deviceModel}
                                    onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5 ml-1">Software Version</label>
                                <input
                                    placeholder="e.g. 17.06.01"
                                    className="w-full rounded-lg border border-node-border bg-node px-4 py-2.5 text-sm font-medium text-white placeholder:text-gray-600 focus:border-cisco-blue focus:outline-none focus:ring-1 focus:ring-cisco-blue"
                                    value={formData.softwareVersion}
                                    onChange={(e) => setFormData({ ...formData, softwareVersion: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5 ml-1">MAC Address</label>
                                    <input
                                        placeholder="e.g. 001A.2B3C.4D5E"
                                        className="w-full rounded-lg border border-node-border bg-node px-4 py-2.5 text-[10px] font-medium text-white placeholder:text-gray-600 focus:border-cisco-blue focus:outline-none"
                                        value={formData.macAddress}
                                        onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5 ml-1">Serial Number</label>
                                    <input
                                        placeholder="e.g. FOC12345678"
                                        className="w-full rounded-lg border border-node-border bg-node px-4 py-2.5 text-[10px] font-medium text-white placeholder:text-gray-600 focus:border-cisco-blue focus:outline-none"
                                        value={formData.serialNumber}
                                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">Blank Config Context</label>
                                <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-node-border bg-node/30 p-4 transition-colors hover:border-cisco-blue/50 cursor-pointer">
                                    <Upload className="mb-2 text-gray-500" size={24} />
                                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider text-center">
                                        Drag hardware context tab (.txt, .cfg)<br />or click to upload
                                    </p>
                                    <input
                                        type="file"
                                        accept=".txt,.cfg"
                                        className="hidden"
                                        onChange={handleConfigUpload}
                                    />
                                </label>
                                {formData.blankConfigContext && (
                                    <div className="mt-2 text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                                        Context attached • fields auto-populated
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-node-border bg-transparent py-3 text-sm font-bold uppercase text-gray-400 transition-colors hover:bg-node hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`flex-1 rounded-lg py-3 text-sm font-bold uppercase text-black transition-opacity hover:opacity-90 ${isCore ? 'bg-core-accent' : 'bg-cisco-blue text-white'}`}
                        >
                            {isCore ? 'Initialize CORE' : (initialData ? 'Update Device' : 'Expand Network')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Plus = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

export default DeviceModal;
