import { AIGateway } from '../lib/ai/aiGateway';
import { TavilySearch } from '../lib/ai/TavilySearch';
import { useSettingsStore } from '../store/useSettingsStore';
import { DeviceNodeData, ValidationResult } from '../types';

export class ValidatorAgent {
    /**
     * Validates CLI commands against specific software version and vendor.
     */
    static async validate(
        cliBlock: string,
        device: DeviceNodeData
    ): Promise<ValidationResult> {
        const systemPrompt = `
You are a Cisco IOS Syntax Validator.
Your goal is to ensure the provided CLI commands are perfectly accurate for the following hardware:
Vendor: ${device.vendor}
Model: ${device.deviceModel}
Version: ${device.softwareVersion}

CLI TO VALIDATE:
${cliBlock}

Respond ONLY with a JSON object in this format:
{
  "valid": boolean,
  "issues": [
    {
      "line": "exact line",
      "issue": "description",
      "severity": "error" | "warning",
      "fix": "corrected command"
    }
  ],
  "softwareNotes": "Caveats for this version",
  "webSearchNeeded": boolean,
  "searchQuery": "If you are unsure, what would you search on Google/Cisco.com?"
}
`;

        try {
            let responseText = await AIGateway.callAI({ prompt: systemPrompt });

            // Basic JSON cleaning if AI adds markdown blocks
            responseText = responseText.replace(/```json\n?|\n?```/g, '').trim();

            let result = JSON.parse(responseText);

            // Handle Web Search if needed
            let webSearchUsed = false;
            let citations: string[] = [];

            if (result.webSearchNeeded) {
                const settings = useSettingsStore.getState();
                if (settings.tavilyApiKey) {
                    const searchData = await TavilySearch.search(result.searchQuery || `Cisco IOS ${device.softwareVersion} ${cliBlock.split('\n')[0]}`, settings.tavilyApiKey);
                    webSearchUsed = true;
                    citations = searchData.results.map(r => r.url);

                    // Second pass with search results
                    const validatorWithSearch = `
The previous validation pass suggested a web search. Here are the results from Cisco.com/NetworkLessons:
${searchData.results.map(r => `Source: ${r.url}\nContent: ${r.content}`).join('\n\n')}

Re-validate the CLI:
${cliBlock}

Hardware: ${device.vendor} ${device.deviceModel} v${device.softwareVersion}

Output the final JSON validation object.
`;
                    const finalResponse = await AIGateway.callAI({ prompt: validatorWithSearch });
                    result = JSON.parse(finalResponse.replace(/```json\n?|\n?```/g, '').trim());
                }
            }

            return {
                valid: result.valid,
                issues: result.issues,
                softwareNotes: result.softwareNotes,
                webSearchUsed,
                searchCitations: citations
            };

        } catch (error: any) {
            console.error('Validation failed:', error);
            return {
                valid: true, // Fail open to not block the user if the validator itself fails
                issues: [{ line: 'N/A', issue: `Validator Error: ${error.message}`, severity: 'warning', fix: '' }],
                softwareNotes: 'Validation service unavailable.',
                webSearchUsed: false
            };
        }
    }
}
