import { AIGateway } from '../lib/ai/aiGateway';
import { DeviceNodeData } from '../types';

export class GlobalConfigAgent {
    /**
     * Generates per-node CLI blocks for a global directive.
     */
    static async generateGlobalConfigs(
        directive: string,
        nodes: DeviceNodeData[]
    ): Promise<Record<string, string>> {
        const systemPrompt = `
You are the NetLab Global Orchestrator. 
Your task is to take a global network directive and generate the EXACT Cisco CLI commands needed for each device in the topology to achieve this goal.

GLOBAL DIRECTIVE:
${directive}

TARGET DEVICES:
${nodes.map(n => `- ${n.hostname} (${n.vendor} ${n.deviceModel} v${n.softwareVersion})`).join('\n')}

For each device, provide the commands in a structured JSON format. 
Only provide the commands that are necessary for that specific device.
If a device doesn't need changes to satisfy the directive, return an empty string for that device.

Output ONLY a JSON object:
{
  "hostname_1": "cli commands...",
  "hostname_2": "cli commands..."
}
`;

        try {
            let response = await AIGateway.callAI({ prompt: systemPrompt });
            response = response.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(response);
        } catch (error) {
            console.error('Global config generation failed:', error);
            throw error;
        }
    }
}
