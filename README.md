# Miyo MCP Server

An MCP (Model Context Protocol) server for [Miyo](https://miyo-link.com), the AI-powered link-in-bio platform. This server allows AI assistants like Claude to manage your Miyo profile, links, analytics, and auctions.

## Features

### Profile Management
- `get_profile` - Get profile by username or ID
- `update_profile` - Update display name and bio
- `list_profiles` - List all profiles with filters

### Link Management
- `list_links` - Get all links for a user
- `create_link` - Create a new link
- `update_link` - Update link title, URL, icon, or status
- `delete_link` - Delete a link
- `reorder_links` - Change link order

### Analytics
- `get_analytics_summary` - Overview of views, clicks, CTR
- `get_profile_views` - Detailed view analytics (by day, country, device)
- `get_link_clicks` - Click analytics for links
- `get_top_links` - Best performing links

### Auctions
- `list_auctions` - List auctions with filters
- `get_auction` - Get auction details with bid history
- `create_auction` - Create a new auction
- `place_bid` - Place a bid
- `get_auction_bids` - Get all bids for an auction
- `cancel_auction` - Cancel an auction
- `get_auction_stats` - Auction statistics

## Installation

```bash
npm install miyo-mcp-server
```

Or clone and build locally:

```bash
git clone https://github.com/miyolink/miyo-mcp-server.git
cd miyo-mcp-server
npm install
npm run build
```

## Configuration

### Environment Variables

Create a `.env` file with your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "miyo": {
      "command": "node",
      "args": ["/path/to/miyo-mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

Or if installed globally via npm:

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

## Usage Examples

Once configured, you can ask Claude to:

- "Show me my Miyo profile"
- "Create a new link to my YouTube channel"
- "What are my top performing links this month?"
- "Show analytics for the last 7 days"
- "Disable the Instagram link"
- "Create an auction for my product"
- "What's the current bid on auction X?"

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run
npm start
```

## API Reference

### Profile Tools

#### get_profile
```typescript
{
  username?: string,  // Username to look up
  user_id?: string    // Or user UUID
}
```

#### update_profile
```typescript
{
  user_id: string,        // Required
  display_name?: string,  // New display name
  bio?: string            // New bio
}
```

### Link Tools

#### create_link
```typescript
{
  user_id: string,  // Required
  title: string,    // Required
  url: string,      // Required
  icon?: string     // Optional icon name
}
```

#### reorder_links
```typescript
{
  user_id: string,    // Required
  link_ids: string[]  // Array of link IDs in new order
}
```

### Analytics Tools

#### get_analytics_summary
```typescript
{
  user_id: string,  // Required
  days?: number     // Default: 30
}
```

Returns: total views, total clicks, CTR, top 5 links

#### get_profile_views
```typescript
{
  user_id: string,
  days?: number,      // Default: 7
  group_by?: 'day' | 'country' | 'device' | 'referrer'
}
```

### Auction Tools

#### create_auction
```typescript
{
  product_id: string,           // Required
  seller_id: string,            // Required
  auction_type?: 'english' | 'buy_now' | 'reserve',
  starting_price: number,       // Required, in EUR
  reserve_price?: number,       // For reserve auctions
  buy_now_price?: number,       // For buy_now auctions
  starts_at: string,            // Required, ISO format
  ends_at: string               // Required, ISO format
}
```

#### place_bid
```typescript
{
  auction_id: string,    // Required
  amount: number,        // Required, in EUR
  bidder_email: string,  // Required
  bidder_name?: string   // Optional
}
```

## License

MIT

## Links

- [Miyo](https://miyo-link.com)
- [GitHub](https://github.com/miyolink/miyo-mcp-server)
- [MCP Protocol](https://modelcontextprotocol.io)
