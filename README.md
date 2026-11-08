<div align="center">

# Miyo MCP Server

**Gestisci il tuo profilo Miyo con l'intelligenza artificiale**

[![npm version](https://img.shields.io/npm/v/miyo-mcp-server.svg)](https://www.npmjs.com/package/miyo-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue.svg)](https://modelcontextprotocol.io)

[English](#english) | [Italiano](#italiano)

</div>

---

## Italiano

### Cos'e Miyo MCP Server?

Miyo MCP Server e un ponte tra la tua piattaforma [Miyo](https://miyo-link.com) e gli assistenti AI come Claude. Grazie al protocollo MCP (Model Context Protocol), puoi gestire il tuo profilo, i tuoi link e le tue aste semplicemente **parlando** con l'AI.

### Perche usarlo?

| Senza MCP | Con MCP |
|-----------|---------|
| Apri il browser | "Aggiungi un link al mio YouTube" |
| Vai su miyo-link.com | L'AI lo fa per te |
| Login | In 2 secondi |
| Naviga alla dashboard | Zero click |
| Clicca "Aggiungi link" | Zero sforzo |
| Compila il form | |
| Salva | |

**Risparmi tempo. Tanto tempo.**

---

### Cosa puoi fare

#### Gestione Profilo
```
"Mostrami il mio profilo Miyo"
"Cambia la mia bio in: Creator di contenuti tech"
"Aggiorna il mio nome visualizzato"
```

#### Gestione Link
```
"Aggiungi un link al mio canale YouTube"
"Disattiva il link di Instagram"
"Metti il link di TikTok in prima posizione"
"Elimina il link al vecchio sito"
"Mostrami tutti i miei link"
```

#### Analytics
```
"Come sta andando il mio profilo?"
"Quali sono i link piu cliccati?"
"Quante visite ho avuto questa settimana?"
"Da quali paesi arrivano le visite?"
```

#### Aste
```
"Crea un'asta per il mio prodotto"
"Qual e l'offerta attuale sull'asta X?"
"Mostrami le statistiche delle mie aste"
"Annulla l'asta se non ci sono offerte"
```

---

### Installazione

#### 1. Installa il server

```bash
npm install -g miyo-mcp-server
```

#### 2. Configura Claude Desktop

Apri il file di configurazione:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Aggiungi questa configurazione:

```json
{
  "mcpServers": {
    "miyo": {
      "command": "miyo-mcp",
      "env": {
        "SUPABASE_URL": "https://tuo-progetto.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "la-tua-service-role-key"
      }
    }
  }
}
```

#### 3. Riavvia Claude Desktop

Fatto! Ora puoi parlare con Claude per gestire Miyo.

---

### Credenziali Supabase

Per ottenere le credenziali:

1. Vai su [app.supabase.com](https://app.supabase.com)
2. Seleziona il tuo progetto Miyo
3. Vai in **Settings** > **API**
4. Copia:
   - **Project URL** -> `SUPABASE_URL`
   - **service_role key** -> `SUPABASE_SERVICE_ROLE_KEY`

> **Nota**: La `service_role` key ha accesso completo. Non condividerla mai.

---

## English

### What is Miyo MCP Server?

Miyo MCP Server bridges your [Miyo](https://miyo-link.com) link-in-bio platform with AI assistants like Claude. Using the MCP (Model Context Protocol), you can manage your profile, links, and auctions just by **talking** to your AI.

### Why use it?

| Without MCP | With MCP |
|-------------|----------|
| Open browser | "Add a link to my YouTube" |
| Go to miyo-link.com | AI does it for you |
| Login | In 2 seconds |
| Navigate to dashboard | Zero clicks |
| Click "Add link" | Zero effort |
| Fill out form | |
| Save | |

**Save time. Lots of time.**

---

### What you can do

#### Profile Management
```
"Show me my Miyo profile"
"Change my bio to: Tech content creator"
"Update my display name"
```

#### Link Management
```
"Add a link to my YouTube channel"
"Disable the Instagram link"
"Move the TikTok link to first position"
"Delete the old website link"
"Show me all my links"
```

#### Analytics
```
"How is my profile performing?"
"Which are my most clicked links?"
"How many visits did I get this week?"
"Which countries are my visitors from?"
```

#### Auctions
```
"Create an auction for my product"
"What's the current bid on auction X?"
"Show me my auction statistics"
"Cancel the auction if there are no bids"
```

---

### Installation

#### 1. Install the server

```bash
npm install -g miyo-mcp-server
```

#### 2. Configure Claude Desktop

Open the config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration:

```json
{
  "mcpServers": {
    "miyo": {
      "command": "miyo-mcp",
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

#### 3. Restart Claude Desktop

Done! Now you can talk to Claude to manage Miyo.

---

### Available Tools

<details>
<summary><b>Profile Tools</b></summary>

| Tool | Description |
|------|-------------|
| `get_profile` | Get profile by username or ID |
| `update_profile` | Update display name and bio |
| `list_profiles` | List all profiles with filters |

</details>

<details>
<summary><b>Link Tools</b></summary>

| Tool | Description |
|------|-------------|
| `list_links` | Get all links for a user |
| `create_link` | Create a new link |
| `update_link` | Update link title, URL, icon, or status |
| `delete_link` | Delete a link |
| `reorder_links` | Change link order |

</details>

<details>
<summary><b>Analytics Tools</b></summary>

| Tool | Description |
|------|-------------|
| `get_analytics_summary` | Overview: views, clicks, CTR |
| `get_profile_views` | Views by day, country, device |
| `get_link_clicks` | Click analytics for links |
| `get_top_links` | Best performing links |

</details>

<details>
<summary><b>Auction Tools</b></summary>

| Tool | Description |
|------|-------------|
| `list_auctions` | List auctions with filters |
| `get_auction` | Get auction details with bids |
| `create_auction` | Create a new auction |
| `place_bid` | Place a bid |
| `get_auction_bids` | Get all bids |
| `cancel_auction` | Cancel an auction |
| `get_auction_stats` | Auction statistics |

</details>

---

### Development

```bash
# Clone the repo
git clone https://github.com/miyolink/miyo-mcp-server.git
cd miyo-mcp-server

# Install dependencies
npm install

# Build
npm run build

# Run locally
npm start
```

---

### Security

- Never share your `SUPABASE_SERVICE_ROLE_KEY`
- The key has full database access
- Use environment variables, never hardcode credentials
- For production, consider using a restricted API key

---

### Support

- [Miyo Website](https://miyo-link.com)
- [GitHub Issues](https://github.com/miyolink/miyo-mcp-server/issues)
- [MCP Protocol Docs](https://modelcontextprotocol.io)

---

<div align="center">

**Made with love by [Miyo](https://miyo-link.com)**

</div>
