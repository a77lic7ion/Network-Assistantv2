# Syntax Validator Agent

**File:** `src/agents/validatorAgent.ts`

This agent runs **before** the configuration output is shown to the user. It is a second AI call (or a structured self-critique pass).

### Validation Prompt

```
You are a Cisco IOS syntax validator.

Review the following CLI commands for the device:
  Software Version: {{SOFTWARE_VERSION}}
  Vendor: {{VENDOR}}
  Device Type: {{DEVICE_TYPE}}

CLI to validate:
{{CLI_BLOCK}}

Respond ONLY with a JSON object:
{
  "valid": true | false,
  "issues": [
    {
      "line": "the exact problematic line",
      "issue": "description of the problem",
      "severity": "error" | "warning",
      "fix": "corrected command"
    }
  ],
  "softwareNotes": "any version-specific caveats",
  "webSearchNeeded": true | false,
  "searchQuery": "optional: what to search if uncertain"
}
```

### Validator Flow

```
AI generates CLI output
         ↓
validatorAgent() called with CLI + device metadata
         ↓
If webSearchNeeded → tavilySearch(searchQuery)
         ↓          inject results into validator prompt
         ↓          re-run validator
         ↓
If issues found → AI corrects CLI (targeted fix prompt)
         ↓
Validated CLI is returned with ValidationResult attached
         ↓
CLIBlock renders with ✅ or ⚠️ status + issue details
```

### Validator Display

If issues are found, the CLIBlock shows an expandable section:

```
⚠️  Validation Issues Found (1 warning):
└── Line: "spanning-tree portfast trunk"
    Warning: 'portfast trunk' is only valid on IOS-XE 16.x+
    Your version: 17.06.01 — This command is valid ✓
    Note: Confirmed via Cisco documentation (search result cited)
```
