# Overview

**NetLab AI** is a single-page application (SPA) that emulates a Cisco-based home lab network environment. The user can:

- **Define a network topology** by placing nodes on an interactive canvas (drag-and-drop)
- **Upload blank config tabs** per device to provide hardware context
- **Query an AI agent** in natural language for configuration tasks (e.g., "What commands do I need on Switch2 to reach Switch1?")
- **Receive validated, copy-pasteable Cisco CLI blocks** in the correct order for the software version
- **Simulate ping/traceroute** between any two nodes based on accumulated configs
- **Push global configuration** (e.g., "create VLAN 17 on all devices") and have each node's running config automatically updated
- **Review each node's current running config** (like `show run`) at any time

The app integrates with five AI providers (Gemini, OpenAI, Anthropic, Mistral, Ollama) and uses Tavily for real-time web search (for documentation lookup and syntax validation).
