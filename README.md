# NetLab AI - Network Assistant

NetLab AI is a next-generation network topology design, simulation, and automation assistant. It leverages advanced AI models (LLMs) to help network engineers visualize topologies, generate configuration, and simulate traffic flows in a deterministic environment.

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🚀 Features

### 1. Intelligent Topology Visualization
- **Interactive Canvas**: Drag-and-drop interface to build network maps.
- **Auto-Discovery**: Upload `show run` or `show tech` files, and the system automatically extracts:
  - Hostname, Model, Serial Number
  - Interface list and status
  - VLANs and IP addresses
  - CDP Neighbors (for auto-linking)
- **Visual Feedback**:
  - **Fiber links**: Orange, dashed lines.
  - **Ethernet links**: Green, solid lines.
  - **Traffic Animation**: Real-time marching ants animation on active links.

### 2. AI-Powered Configuration
- **Global Chat Agent**: Ask questions like "Show me all trunk ports" or "What is the management IP of Core Switch 1?" and the AI parses the live configuration of all devices to answer.
- **Device-Specific Context**: Chat with individual nodes to generate specific config blocks (e.g., "Configure OSPF on area 0").
- **Multi-Vendor Support**: Logic adapters for Cisco IOS-XE, NX-OS, Juniper Junos, and Arista EOS.

### 3. Packet Trace Analytics & Simulation
- **Deterministic Simulator**: Verify connectivity between nodes without a real lab.
- **Hop-by-Hop Analytics**:
  - **Latency**: Simulated processing and serialization delay.
  - **Jitter & Loss**: Estimates based on link medium (Fiber vs Copper).
  - **MTU & Encapsulation**: Checks for MTU mismatches and VLAN tagging.
- **Visual Trace**: See the path packets take across your designed topology.

### 4. Integration Ecosystem
- **LLM Gateway**: Connect to OpenAI, Anthropic (Claude), Google Gemini, Mistral, or local Ollama instances.
- **Tavily AI Search**: Real-time web search for syntax validation and error checking.

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Modern Browser**: Chrome, Edge, or Firefox (WebGPU/WebGL recommended for large topologies)

### Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/netlab-ai.git
   cd netlab-ai
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   The application will launch at `http://localhost:5173`.

---

## 📖 Usage Guide

### Adding Devices
1. Click **"Add Node"** or **"Add CORE Device"** in the sidebar.
2. Fill in the details manually OR **drag-and-drop** a config file (`.txt`, `.cfg`) into the "Hardware Context" zone.
3. The device will be instantiated with all its interfaces and running configuration immediately applied.

### Connecting Nodes
1. Click the **"Link"** handle (dots) on any node.
2. Drag to another node to create a connection.
3. A **Link Configuration Modal** will appear.
4. Select the **Source** and **Target** interfaces.
   - *Tip: The system intelligently suggests ports based on CDP neighbor info if available.*
5. Choose the **Medium** (Fiber/Ethernet) and **Mode** (Trunk/Access).
6. Click **Confirm**.

### Running Simulations
1. Switch to the **"Simulator"** view from the sidebar.
2. Select an **Originating Source** and **Destination Target** node.
3. Click **"Start Simulation"**.
4. View the detailed hop-by-hop analysis, including latency, jitter, and protocol checks.

### AI Chat
1. Open the **"Chat"** view.
2. Ensure your API keys are configured in **Settings** (Top Right Gear Icon).
3. Ask questions about your topology. The AI has full read access to the current state of all nodes.

---

## ⚙️ Configuration

### API Keys
NetLab AI requires API keys for its intelligence features. These are stored locally in your browser (`localStorage`) and are never sent to our servers.

1. Click the **Settings (Gear)** icon in the top right.
2. Enter keys for your preferred providers:
   - **OpenAI** (GPT-4)
   - **Anthropic** (Claude 3.5 Sonnet)
   - **Google** (Gemini Pro)
   - **Tavily** (for Web Search)
3. For **Ollama**, ensure your local instance allows CORS:
   ```bash
   OLLAMA_ORIGINS="*" ollama serve
   ```

---

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **State Management**: Zustand (with persistence)
- **Visualization**: React Flow
- **Styling**: Tailwind CSS
- **AI Integration**: Custom AI Gateway with Adapter Pattern

---

## 🤝 Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
