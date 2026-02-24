/**
 * configTabParser.ts
 * Parses raw text from Cisco "show" command outputs (blank config tabs)
 * to extract hardware capabilities and interface inventory.
 */

export interface ParsedInterface {
    name: string;
    ipAddress?: string;
    mask?: string;
    description?: string;
    mode?: 'access' | 'trunk' | 'routed';
    vlan?: string; // For access VLAN or native VLAN on trunk
    allowedVlans?: string; // For trunk allowed VLANs
    cdpNeighbor?: {
        hostname: string;
        localPort: string;
    };
    // Potentially add more fields like speed, duplex, cdp neighbor, etc.
}

export interface ParsedConfigTab {
    hostname: string;
    managementIp: string;
    allIps: string[]; // List of all detected IPs (SVIs, etc.)
    interfaces: ParsedInterface[];
    vlanRange: string;
    hardwareModel: string;
    osVersion: string;
    macAddress: string;
    serialNumber: string;
    raw: string;
}

export class ConfigTabParser {
    /**
     * Naive parser to extract context from a "show inventory", "show version", 
     * or "show interface status" dump.
     */
    static parse(text: string): ParsedConfigTab {
        let interfaces: ParsedInterface[] = [];
        let hardwareModel = '';
        let osVersion = '';
        let vlanRange = '';
        let hostname = '';
        let managementIp = '';
        let allIps: string[] = [];
        let macAddress = '';
        let serialNumber = '';

        const lines = text.split('\n');
        let currentInterface: ParsedInterface | null = null;

        lines.forEach(line => {
            const trimmed = line.trim();

            // Hostname
            const hostnameMatch = line.match(/^hostname\s+(\S+)/i);
            if (hostnameMatch && !hostname) {
                hostname = hostnameMatch[1];
            }

            // IP Addresses (collect all)
            const ipMatch = line.match(/ip address\s+([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\s+([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/i);
            if (ipMatch) {
                const ip = ipMatch[1];
                if (!allIps.includes(ip)) {
                    allIps.push(ip);
                }
                if (!managementIp) managementIp = ip;
            }

            // Hardware model
            const modelMatch = line.match(/(?:Model|PID|Hardware|Board ID):\s*([a-zA-Z0-9\-]+)/i);
            if (modelMatch && !hardwareModel) {
                hardwareModel = modelMatch[1];
            }
            // Specific Cisco model patterns
            if (!hardwareModel) {
                const ciscoModelMatch = line.match(/(C[0-9]{4}[A-Z]*-[0-9A-Z]+)/i);
                if (ciscoModelMatch) hardwareModel = ciscoModelMatch[1];
            }

            // OS Version
            const versionMatch = line.match(/(?:Version|Software|IOS-XE Version|IOS Version|Release)\s*([0-9\(\)a-zA-Z\.]+)/i);
            if (versionMatch && !osVersion) {
                osVersion = versionMatch[1];
            }

            // MAC Address
            const macMatch = line.match(/(?:MAC Address|Base Ethernet MAC Address|Burned-in Address|BIA)\s*(?:is\s*)?([0-9a-fA-F]{4}\.[0-9a-fA-F]{4}\.[0-9a-fA-F]{4}|[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2})/i);
            if (macMatch && !macAddress) {
                macAddress = macMatch[1];
            }

            // Serial Number
            const serialMatch = line.match(/(?:Serial Number|System Serial Number|SN|Processor board ID)\s*(?:is\s*)?([a-zA-Z0-9]{10,12})/i);
            if (serialMatch && !serialNumber) {
                serialNumber = serialMatch[1];
            }

            // Interface parsing
            const interfaceStartMatch = line.match(/^(interface\s+(?:GigabitEthernet|FastEthernet|TenGigabitEthernet|Ethernet|Vlan|Port-channel|Management)\s*[0-9\/\.]+)/i);
            if (interfaceStartMatch) {
                if (currentInterface) {
                    interfaces.push(currentInterface);
                }
                const name = interfaceStartMatch[1].replace('interface ', '').trim();
                
                // Determine Media Type
                let mediaType: 'Eth' | 'Fiber' | 'Mgmt' | 'Console' = 'Eth';
                if (name.toLowerCase().includes('vlan')) mediaType = 'Eth';
                if (name.toLowerCase().includes('mgmt') || name.toLowerCase().includes('management')) mediaType = 'Mgmt';
                if (name.toLowerCase().includes('console')) mediaType = 'Console';
                if (name.toLowerCase().includes('ten') || name.toLowerCase().includes('forty') || name.toLowerCase().includes('hundred')) mediaType = 'Fiber';

                currentInterface = { 
                    name,
                    status: 'up',
                    mediaType 
                };
            } else if (currentInterface) {
                // Parse details within the current interface block
                const ipAddressMatch = line.match(/^\s*ip address\s+([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\s+([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/i);
                if (ipAddressMatch) {
                    currentInterface.ipAddress = ipAddressMatch[1];
                    currentInterface.mask = ipAddressMatch[2];
                    if (!currentInterface.mode) currentInterface.mode = 'routed'; // Assume routed if IP and no switchport
                }

                const descriptionMatch = line.match(/^\s*description\s+(.*)/i);
                if (descriptionMatch) {
                    const desc = descriptionMatch[1].trim();
                    currentInterface.description = desc;

                    // Fiber override if description implies it
                    if (desc.toLowerCase().includes('sfp') || desc.toLowerCase().includes('fiber')) {
                        currentInterface.mediaType = 'Fiber';
                    }

                    // Intelligent discovery from description
                    // Pattern: "To HOSTNAME port Gi1/0/1" or "Connects to HOSTNAME"
                    const neighborMatch = desc.match(/(?:to|connects? to|neighbor:)\s+([a-zA-Z0-9\-_]+)(?:\s+(?:port|on)\s+([a-zA-Z0-9\/\.]+))?/i);
                    if (neighborMatch) {
                        currentInterface.cdpNeighbor = {
                            hostname: neighborMatch[1],
                            localPort: neighborMatch[2] || 'unknown'
                        };
                    }
                }

                const switchportModeAccessMatch = line.match(/^\s*switchport mode access/i);
                if (switchportModeAccessMatch) {
                    currentInterface.mode = 'access';
                }

                const switchportAccessVlanMatch = line.match(/^\s*switchport access vlan\s+(\d+)/i);
                if (switchportAccessVlanMatch) {
                    currentInterface.vlan = switchportAccessVlanMatch[1];
                }

                const switchportModeTrunkMatch = line.match(/^\s*switchport mode trunk/i);
                if (switchportModeTrunkMatch) {
                    currentInterface.mode = 'trunk';
                }

                const switchportTrunkAllowedVlanMatch = line.match(/^\s*switchport trunk allowed vlan\s+(.*)/i);
                if (switchportTrunkAllowedVlanMatch) {
                    currentInterface.allowedVlans = switchportTrunkAllowedVlanMatch[1];
                }

                // CDP Neighbor parsing (assuming 'show cdp neighbor detail' output is part of the text)
                // This is a simplified regex and might need refinement based on actual output formats
                const cdpNeighborMatch = line.match(/Device ID:\s*(\S+).*?Interface:\s*(\S+)/s);
                if (cdpNeighborMatch) {
                    currentInterface.cdpNeighbor = {
                        hostname: cdpNeighborMatch[1],
                        localPort: cdpNeighborMatch[2]
                    };
                }

            }
        });

        if (currentInterface) {
            interfaces.push(currentInterface);
        }

        return {
            hostname,
            managementIp,
            allIps,
            interfaces,
            hardwareModel,
            osVersion,
            macAddress,
            serialNumber,
            vlanRange,
            raw: text
        };
    }

    /**
     * Helper to determine if an interface is a physical port (Ethernet/Fiber)
     * vs a logical one (VLAN, Loopback, Tunnel, Port-channel).
     */
    static isPhysicalInterface(name: string): boolean {
        const lower = name.toLowerCase();
        // Check for common physical interface prefixes
        if (lower.startsWith('gi') || lower.startsWith('te') || lower.startsWith('fa') || lower.startsWith('eth') || lower.startsWith('twe') || lower.startsWith('hu') || lower.startsWith('fo')) {
            return true;
        }
        return false;
    }

    /**
     * Returns a structured summary string for AI context ingestion.
     */
    static getSummaryForAI(text: string): string {
        const parsed = this.parse(text);
        return `
HARDWARE INVENTORY SUMMARY:
- Hostname: ${parsed.hostname || 'Unknown'}
- Management IP: ${parsed.managementIp || 'Unknown'}
- Detected Model: ${parsed.hardwareModel || 'Unknown'}
- OS Version: ${parsed.osVersion || 'Unknown'}
- Available Interfaces: ${parsed.interfaces.slice(0, 10).join(', ')}${parsed.interfaces.length > 10 ? '...' : ''}
- Total Interfaces Found: ${parsed.interfaces.length}
${parsed.interfaces.map(intf => intf.cdpNeighbor ? `- Interface ${intf.name} connected to ${intf.cdpNeighbor.hostname} on its port ${intf.cdpNeighbor.localPort}` : '').filter(Boolean).join('\n')}

RAW DUMP (Contextual Reference):
${text.slice(0, 2000)} ${text.length > 2000 ? '[TRUNCATED]' : ''}
`.trim();
    }
}
