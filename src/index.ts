#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

let supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!supabase) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new McpError(
        ErrorCode.InternalError,
        'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
      )
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  }
  return supabase
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  is_premium: boolean
  subscription_type: string
}

interface Link {
  id: string
  user_id: string
  title: string
  url: string
  icon: string | null
  position: number
  is_active: boolean
  clicks: number
  created_at: string
}

interface ProfileView {
  id: string
  profile_id: string
  visitor_ip: string | null
  country: string | null
  city: string | null
  device_type: string | null
  referrer: string | null
  created_at: string
}

interface LinkClick {
  id: string
  link_id: string
  visitor_ip: string | null
  country: string | null
  city: string | null
  device_type: string | null
  referrer: string | null
  created_at: string
}

interface Auction {
  id: string
  product_id: string
  seller_id: string
  auction_type: 'english' | 'buy_now' | 'reserve'
  starting_price: number
  current_price: number
  reserve_price: number | null
  buy_now_price: number | null
  status: 'draft' | 'scheduled' | 'active' | 'ended' | 'sold' | 'cancelled'
  total_bids: number
  starts_at: string
  ends_at: string
}

// ============================================================================
// SERVER SETUP
// ============================================================================

const server = new Server(
  {
    name: 'miyo-mcp-server',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
)

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ========== PROFILE TOOLS ==========
      {
        name: 'get_profile',
        description: 'Get a user profile by username or user ID',
        inputSchema: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: 'The username to look up'
            },
            user_id: {
              type: 'string',
              description: 'The user UUID to look up'
            }
          }
        }
      },
      {
        name: 'update_profile',
        description: 'Update a user profile (display name, bio, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'The user UUID'
            },
            display_name: {
              type: 'string',
              description: 'New display name'
            },
            bio: {
              type: 'string',
              description: 'New bio text'
            }
          },
          required: ['user_id']
        }
      },
      {
        name: 'list_profiles',
        description: 'List all profiles with optional filters',
        inputSchema: {
          type: 'object',
          properties: {
            is_premium: {
              type: 'boolean',
              description: 'Filter by premium status'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 20)'
            }
          }
        }
      },

      // ========== LINK TOOLS ==========
      {
        name: 'list_links',
        description: 'Get all links for a user',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'The user UUID'
            },
            username: {
              type: 'string',
              description: 'The username (alternative to user_id)'
            },
            include_inactive: {
              type: 'boolean',
              description: 'Include inactive links (default: false)'
            }
          }
        }
      },
      {
        name: 'create_link',
        description: 'Create a new link for a user',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'The user UUID'
            },
            title: {
              type: 'string',
              description: 'Link title'
            },
            url: {
              type: 'string',
              description: 'Link URL'
            },
            icon: {
              type: 'string',
              description: 'Icon name (optional)'
            }
          },
          required: ['user_id', 'title', 'url']
        }
      },
      {
        name: 'update_link',
        description: 'Update an existing link',
        inputSchema: {
          type: 'object',
          properties: {
            link_id: {
              type: 'string',
              description: 'The link UUID'
            },
            title: {
              type: 'string',
              description: 'New title'
            },
            url: {
              type: 'string',
              description: 'New URL'
            },
            icon: {
              type: 'string',
              description: 'New icon'
            },
            is_active: {
              type: 'boolean',
              description: 'Enable/disable the link'
            }
          },
          required: ['link_id']
        }
      },
      {
        name: 'delete_link',
        description: 'Delete a link',
        inputSchema: {
          type: 'object',
          properties: {
            link_id: {
              type: 'string',
              description: 'The link UUID to delete'
            }
          },
          required: ['link_id']
        }
      },
      {
        name: 'reorder_links',
        description: 'Reorder links for a user',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'The user UUID'
            },
            link_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of link IDs in the new order'
            }
          },
          required: ['user_id', 'link_ids']
        }
      },

      // ========== ANALYTICS TOOLS ==========
      {
        name: 'get_analytics_summary',
        description: 'Get analytics summary for a user (views, clicks, top links)',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'The user UUID'
            },
            days: {
              type: 'number',
              description: 'Number of days to analyze (default: 30)'
            }
          },
          required: ['user_id']
        }
      },
      {
        name: 'get_profile_views',
        description: 'Get profile view analytics',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'The user UUID'
            },
            days: {
              type: 'number',
              description: 'Number of days (default: 7)'
            },
            group_by: {
              type: 'string',
              enum: ['day', 'country', 'device', 'referrer'],
              description: 'Group results by this field'
            }
          },
          required: ['user_id']
        }
      },
      {
        name: 'get_link_clicks',
        description: 'Get click analytics for links',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'The user UUID (for all links)'
            },
            link_id: {
              type: 'string',
              description: 'Specific link UUID'
            },
            days: {
              type: 'number',
              description: 'Number of days (default: 7)'
            }
          }
        }
      },
      {
        name: 'get_top_links',
        description: 'Get the top performing links by clicks',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'The user UUID'
            },
            limit: {
              type: 'number',
              description: 'Number of links to return (default: 5)'
            },
            days: {
              type: 'number',
              description: 'Time period in days (default: 30)'
            }
          },
          required: ['user_id']
        }
      },

      // ========== AUCTION TOOLS ==========
      {
        name: 'list_auctions',
        description: 'List all auctions with optional filters',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['active', 'scheduled', 'ended', 'sold', 'all'],
              description: 'Filter by status (default: active)'
            },
            seller_id: {
              type: 'string',
              description: 'Filter by seller UUID'
            },
            limit: {
              type: 'number',
              description: 'Maximum results (default: 20)'
            }
          }
        }
      },
      {
        name: 'get_auction',
        description: 'Get detailed information about an auction',
        inputSchema: {
          type: 'object',
          properties: {
            auction_id: {
              type: 'string',
              description: 'The auction UUID'
            }
          },
          required: ['auction_id']
        }
      },
      {
        name: 'create_auction',
        description: 'Create a new auction for a product',
        inputSchema: {
          type: 'object',
          properties: {
            product_id: {
              type: 'string',
              description: 'Product UUID'
            },
            seller_id: {
              type: 'string',
              description: 'Seller UUID'
            },
            auction_type: {
              type: 'string',
              enum: ['english', 'buy_now', 'reserve'],
              description: 'Type of auction'
            },
            starting_price: {
              type: 'number',
              description: 'Starting price in EUR'
            },
            reserve_price: {
              type: 'number',
              description: 'Reserve price (for reserve auctions)'
            },
            buy_now_price: {
              type: 'number',
              description: 'Buy now price'
            },
            starts_at: {
              type: 'string',
              description: 'Start date/time (ISO format)'
            },
            ends_at: {
              type: 'string',
              description: 'End date/time (ISO format)'
            }
          },
          required: ['product_id', 'seller_id', 'starting_price', 'starts_at', 'ends_at']
        }
      },
      {
        name: 'place_bid',
        description: 'Place a bid on an active auction',
        inputSchema: {
          type: 'object',
          properties: {
            auction_id: {
              type: 'string',
              description: 'The auction UUID'
            },
            amount: {
              type: 'number',
              description: 'Bid amount in EUR'
            },
            bidder_email: {
              type: 'string',
              description: 'Bidder email'
            },
            bidder_name: {
              type: 'string',
              description: 'Bidder name (optional)'
            }
          },
          required: ['auction_id', 'amount', 'bidder_email']
        }
      },
      {
        name: 'get_auction_bids',
        description: 'Get bid history for an auction',
        inputSchema: {
          type: 'object',
          properties: {
            auction_id: {
              type: 'string',
              description: 'The auction UUID'
            },
            limit: {
              type: 'number',
              description: 'Maximum bids to return (default: 50)'
            }
          },
          required: ['auction_id']
        }
      },
      {
        name: 'cancel_auction',
        description: 'Cancel an auction (only draft/scheduled, or active with no bids)',
        inputSchema: {
          type: 'object',
          properties: {
            auction_id: {
              type: 'string',
              description: 'The auction UUID'
            }
          },
          required: ['auction_id']
        }
      },
      {
        name: 'get_auction_stats',
        description: 'Get auction statistics for a seller',
        inputSchema: {
          type: 'object',
          properties: {
            seller_id: {
              type: 'string',
              description: 'Seller UUID (optional, omit for global stats)'
            }
          }
        }
      }
    ]
  }
})

// ============================================================================
// TOOL HANDLERS
// ============================================================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      // Profile tools
      case 'get_profile':
        return await getProfile(args as { username?: string; user_id?: string })
      case 'update_profile':
        return await updateProfile(args as { user_id: string; display_name?: string; bio?: string })
      case 'list_profiles':
        return await listProfiles(args as { is_premium?: boolean; limit?: number })

      // Link tools
      case 'list_links':
        return await listLinks(args as { user_id?: string; username?: string; include_inactive?: boolean })
      case 'create_link':
        return await createLink(args as { user_id: string; title: string; url: string; icon?: string })
      case 'update_link':
        return await updateLink(args as { link_id: string; title?: string; url?: string; icon?: string; is_active?: boolean })
      case 'delete_link':
        return await deleteLink(args as { link_id: string })
      case 'reorder_links':
        return await reorderLinks(args as { user_id: string; link_ids: string[] })

      // Analytics tools
      case 'get_analytics_summary':
        return await getAnalyticsSummary(args as { user_id: string; days?: number })
      case 'get_profile_views':
        return await getProfileViews(args as { user_id: string; days?: number; group_by?: string })
      case 'get_link_clicks':
        return await getLinkClicks(args as { user_id?: string; link_id?: string; days?: number })
      case 'get_top_links':
        return await getTopLinks(args as { user_id: string; limit?: number; days?: number })

      // Auction tools
      case 'list_auctions':
        return await listAuctions(args as { status?: string; seller_id?: string; limit?: number })
      case 'get_auction':
        return await getAuction(args as { auction_id: string })
      case 'create_auction':
        return await createAuction(args as any)
      case 'place_bid':
        return await placeBid(args as { auction_id: string; amount: number; bidder_email: string; bidder_name?: string })
      case 'get_auction_bids':
        return await getAuctionBids(args as { auction_id: string; limit?: number })
      case 'cancel_auction':
        return await cancelAuction(args as { auction_id: string })
      case 'get_auction_stats':
        return await getAuctionStats(args as { seller_id?: string })

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`)
    }
  } catch (error) {
    if (error instanceof McpError) throw error
    throw new McpError(ErrorCode.InternalError, `Error: ${(error as Error).message}`)
  }
})

// ============================================================================
// PROFILE IMPLEMENTATIONS
// ============================================================================

async function getProfile(params: { username?: string; user_id?: string }) {
  const db = getSupabase()
  const { username, user_id } = params

  if (!username && !user_id) {
    throw new McpError(ErrorCode.InvalidParams, 'Either username or user_id is required')
  }

  let query = db.from('profiles').select('*')

  if (username) {
    query = query.eq('username', username)
  } else {
    query = query.eq('id', user_id)
  }

  const { data, error } = await query.single()

  if (error) {
    throw new McpError(ErrorCode.InternalError, `Profile not found: ${error.message}`)
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
  }
}

async function updateProfile(params: { user_id: string; display_name?: string; bio?: string }) {
  const db = getSupabase()
  const { user_id, ...updates } = params

  const updateData: Record<string, any> = {}
  if (updates.display_name !== undefined) updateData.display_name = updates.display_name
  if (updates.bio !== undefined) updateData.bio = updates.bio

  if (Object.keys(updateData).length === 0) {
    throw new McpError(ErrorCode.InvalidParams, 'No fields to update')
  }

  const { data, error } = await db
    .from('profiles')
    .update(updateData)
    .eq('id', user_id)
    .select()
    .single()

  if (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to update profile: ${error.message}`)
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ success: true, profile: data }, null, 2) }]
  }
}

async function listProfiles(params: { is_premium?: boolean; limit?: number }) {
  const db = getSupabase()
  const { is_premium, limit = 20 } = params

  let query = db.from('profiles').select('id, username, display_name, bio, avatar_url, is_premium, subscription_type').limit(limit)

  if (is_premium !== undefined) {
    query = query.eq('is_premium', is_premium)
  }

  const { data, error } = await query

  if (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to list profiles: ${error.message}`)
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ count: data?.length || 0, profiles: data || [] }, null, 2) }]
  }
}

// ============================================================================
// LINK IMPLEMENTATIONS
// ============================================================================

async function listLinks(params: { user_id?: string; username?: string; include_inactive?: boolean }) {
  const db = getSupabase()
  let { user_id, username, include_inactive = false } = params

  // Resolve username to user_id if needed
  if (!user_id && username) {
    const { data: profile } = await db.from('profiles').select('id').eq('username', username).single()
    if (profile) user_id = profile.id
  }

  if (!user_id) {
    throw new McpError(ErrorCode.InvalidParams, 'Either user_id or username is required')
  }

  let query = db.from('links').select('*').eq('user_id', user_id).order('position', { ascending: true })

  if (!include_inactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to list links: ${error.message}`)
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ count: data?.length || 0, links: data || [] }, null, 2) }]
  }
}

async function createLink(params: { user_id: string; title: string; url: string; icon?: string }) {
  const db = getSupabase()
  const { user_id, title, url, icon } = params

  // Get next position
  const { data: existing } = await db.from('links').select('position').eq('user_id', user_id).order('position', { ascending: false }).limit(1)
  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0

  const { data, error } = await db
    .from('links')
    .insert({
      user_id,
      title,
      url,
      icon: icon || null,
      position: nextPosition,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to create link: ${error.message}`)
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ success: true, link: data }, null, 2) }]
  }
}

async function updateLink(params: { link_id: string; title?: string; url?: string; icon?: string; is_active?: boolean }) {
  const db = getSupabase()
  const { link_id, ...updates } = params

  const updateData: Record<string, any> = {}
  if (updates.title !== undefined) updateData.title = updates.title
  if (updates.url !== undefined) updateData.url = updates.url
  if (updates.icon !== undefined) updateData.icon = updates.icon
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active

  if (Object.keys(updateData).length === 0) {
    throw new McpError(ErrorCode.InvalidParams, 'No fields to update')
  }

  const { data, error } = await db
    .from('links')
    .update(updateData)
    .eq('id', link_id)
    .select()
    .single()

  if (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to update link: ${error.message}`)
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ success: true, link: data }, null, 2) }]
  }
}

async function deleteLink(params: { link_id: string }) {
  const db = getSupabase()
  const { link_id } = params

  const { error } = await db.from('links').delete().eq('id', link_id)

  if (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to delete link: ${error.message}`)
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Link deleted' }, null, 2) }]
  }
}

async function reorderLinks(params: { user_id: string; link_ids: string[] }) {
  const db = getSupabase()
  const { user_id, link_ids } = params

  // Update positions
  const updates = link_ids.map((id, index) =>
    db.from('links').update({ position: index }).eq('id', id).eq('user_id', user_id)
  )

  await Promise.all(updates)

  return {
    content: [{ type: 'text', text: JSON.stringify({ success: true, message: `Reordered ${link_ids.length} links` }, null, 2) }]
  }
}

// ============================================================================
// ANALYTICS IMPLEMENTATIONS
// ============================================================================

async function getAnalyticsSummary(params: { user_id: string; days?: number }) {
  const db = getSupabase()
  const { user_id, days = 30 } = params

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startDateStr = startDate.toISOString()

  // Get profile views
  const { data: views, error: viewsError } = await db
    .from('profile_views')
    .select('id')
    .eq('profile_id', user_id)
    .gte('created_at', startDateStr)

  // Get link clicks
  const { data: links } = await db
    .from('links')
    .select('id, title, clicks')
    .eq('user_id', user_id)
    .order('clicks', { ascending: false })

  const totalViews = views?.length || 0
  const totalClicks = links?.reduce((sum, l) => sum + (l.clicks || 0), 0) || 0
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0'

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        period_days: days,
        total_views: totalViews,
        total_clicks: totalClicks,
        click_through_rate: `${ctr}%`,
        top_links: links?.slice(0, 5) || []
      }, null, 2)
    }]
  }
}

async function getProfileViews(params: { user_id: string; days?: number; group_by?: string }) {
  const db = getSupabase()
  const { user_id, days = 7, group_by } = params

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await db
    .from('profile_views')
    .select('*')
    .eq('profile_id', user_id)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to get views: ${error.message}`)
  }

  let result: any = { total: data?.length || 0, views: data || [] }

  // Group if requested
  if (group_by && data) {
    const grouped: Record<string, number> = {}
    data.forEach(view => {
      let key: string
      switch (group_by) {
        case 'day':
          key = new Date(view.created_at).toISOString().split('T')[0]
          break
        case 'country':
          key = view.country || 'Unknown'
          break
        case 'device':
          key = view.device_type || 'Unknown'
          break
        case 'referrer':
          key = view.referrer || 'Direct'
          break
        default:
          key = 'all'
      }
      grouped[key] = (grouped[key] || 0) + 1
    })
    result = { total: data.length, grouped }
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  }
}

async function getLinkClicks(params: { user_id?: string; link_id?: string; days?: number }) {
  const db = getSupabase()
  const { user_id, link_id, days = 7 } = params

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  if (link_id) {
    const { data, error } = await db
      .from('link_clicks')
      .select('*')
      .eq('link_id', link_id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      throw new McpError(ErrorCode.InternalError, `Failed to get clicks: ${error.message}`)
    }

    return {
      content: [{ type: 'text', text: JSON.stringify({ total: data?.length || 0, clicks: data || [] }, null, 2) }]
    }
  }

  if (user_id) {
    // Get all links for user first
    const { data: links } = await db.from('links').select('id, title').eq('user_id', user_id)

    if (!links || links.length === 0) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ total: 0, links: [] }, null, 2) }]
      }
    }

    const linkIds = links.map(l => l.id)
    const { data: clicks } = await db
      .from('link_clicks')
      .select('link_id')
      .in('link_id', linkIds)
      .gte('created_at', startDate.toISOString())

    // Count clicks per link
    const clickCounts: Record<string, number> = {}
    clicks?.forEach(c => {
      clickCounts[c.link_id] = (clickCounts[c.link_id] || 0) + 1
    })

    const result = links.map(l => ({
      ...l,
      clicks_in_period: clickCounts[l.id] || 0
    })).sort((a, b) => b.clicks_in_period - a.clicks_in_period)

    return {
      content: [{ type: 'text', text: JSON.stringify({ period_days: days, links: result }, null, 2) }]
    }
  }

  throw new McpError(ErrorCode.InvalidParams, 'Either user_id or link_id is required')
}

async function getTopLinks(params: { user_id: string; limit?: number; days?: number }) {
  const db = getSupabase()
  const { user_id, limit = 5, days = 30 } = params

  const { data, error } = await db
    .from('links')
    .select('id, title, url, clicks')
    .eq('user_id', user_id)
    .eq('is_active', true)
    .order('clicks', { ascending: false })
    .limit(limit)

  if (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to get top links: ${error.message}`)
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ top_links: data || [] }, null, 2) }]
  }
}

// ============================================================================
// AUCTION IMPLEMENTATIONS
// ============================================================================

async function listAuctions(params: { status?: string; seller_id?: string; limit?: number }) {
  const db = getSupabase()
  const { status = 'active', seller_id, limit = 20 } = params

  let query = db
    .from('auctions')
    .select(`
      id, product_id, seller_id, auction_type, starting_price, current_price,
      buy_now_price, reserve_price, reserve_met, total_bids, unique_bidders,
      watchers, starts_at, ends_at, status,
      products(name, description),
      profiles(username, display_name)
    `)
    .order('ends_at', { ascending: true })
    .limit(limit)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  if (seller_id) {
    query = query.eq('seller_id', seller_id)
  }

  const { data, error } = await query

  if (error) {
    throw new McpError(ErrorCode.InternalError, `Database error: ${error.message}`)
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ count: data?.length || 0, auctions: data || [] }, null, 2) }]
  }
}

async function getAuction(params: { auction_id: string }) {
  const db = getSupabase()
  const { auction_id } = params

  const { data: auction, error } = await db
    .from('auctions')
    .select(`
      *,
      products(id, name, description, images),
      profiles(username, display_name)
    `)
    .eq('id', auction_id)
    .single()

  if (error) {
    throw new McpError(ErrorCode.InternalError, `Auction not found: ${error.message}`)
  }

  // Get recent bids
  const { data: bids } = await db
    .from('auction_bids')
    .select('id, amount, bidder_name, is_winning, created_at')
    .eq('auction_id', auction_id)
    .order('amount', { ascending: false })
    .limit(10)

  return {
    content: [{ type: 'text', text: JSON.stringify({ auction, recent_bids: bids || [] }, null, 2) }]
  }
}

async function createAuction(params: {
  product_id: string
  seller_id: string
  auction_type?: string
  starting_price: number
  reserve_price?: number
  buy_now_price?: number
  starts_at: string
  ends_at: string
}) {
  const db = getSupabase()

  const {
    product_id,
    seller_id,
    auction_type = 'english',
    starting_price,
    reserve_price,
    buy_now_price,
    starts_at,
    ends_at
  } = params

  const startsAtDate = new Date(starts_at)
  const now = new Date()
  const initialStatus = startsAtDate <= now ? 'active' : 'scheduled'

  const { data, error } = await db
    .from('auctions')
    .insert({
      product_id,
      seller_id,
      auction_type,
      starting_price,
      current_price: starting_price,
      reserve_price: auction_type === 'reserve' ? reserve_price : null,
      buy_now_price: auction_type === 'buy_now' ? buy_now_price : null,
      bid_increment_type: 'fixed',
      bid_increment_value: 1,
      starts_at,
      ends_at,
      original_end_time: ends_at,
      anti_snipe_type: 'extension',
      anti_snipe_minutes: 5,
      status: initialStatus
    })
    .select()
    .single()

  if (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to create auction: ${error.message}`)
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        message: `Auction created with status: ${initialStatus}`,
        auction: data
      }, null, 2)
    }]
  }
}

async function placeBid(params: { auction_id: string; amount: number; bidder_email: string; bidder_name?: string }) {
  const db = getSupabase()
  const { auction_id, amount, bidder_email, bidder_name } = params

  const { data, error } = await db.rpc('place_bid', {
    p_auction_id: auction_id,
    p_amount: amount,
    p_bidder_email: bidder_email,
    p_bidder_name: bidder_name || null
  })

  if (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to place bid: ${error.message}`)
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        message: data.was_extended ? 'Bid placed! Auction extended.' : 'Bid placed successfully!',
        current_price: data.current_price,
        min_next_bid: data.min_next_bid,
        was_extended: data.was_extended,
        ends_at: data.ends_at
      }, null, 2)
    }]
  }
}

async function getAuctionBids(params: { auction_id: string; limit?: number }) {
  const db = getSupabase()
  const { auction_id, limit = 50 } = params

  const { data, error } = await db
    .from('auction_bids')
    .select('*')
    .eq('auction_id', auction_id)
    .order('amount', { ascending: false })
    .limit(limit)

  if (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to get bids: ${error.message}`)
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ count: data?.length || 0, bids: data || [] }, null, 2) }]
  }
}

async function cancelAuction(params: { auction_id: string }) {
  const db = getSupabase()
  const { auction_id } = params

  const { data: auction, error: fetchError } = await db
    .from('auctions')
    .select('status, total_bids')
    .eq('id', auction_id)
    .single()

  if (fetchError) {
    throw new McpError(ErrorCode.InternalError, `Auction not found: ${fetchError.message}`)
  }

  if (auction.status === 'sold' || auction.status === 'ended') {
    throw new McpError(ErrorCode.InvalidRequest, 'Cannot cancel ended auction')
  }

  if (auction.status === 'active' && auction.total_bids > 0) {
    throw new McpError(ErrorCode.InvalidRequest, 'Cannot cancel active auction with bids')
  }

  const { error } = await db
    .from('auctions')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', auction_id)

  if (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to cancel: ${error.message}`)
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Auction cancelled' }, null, 2) }]
  }
}

async function getAuctionStats(params: { seller_id?: string }) {
  const db = getSupabase()
  const { seller_id } = params

  let query = db.from('auctions').select('status, current_price, total_bids, starting_price')

  if (seller_id) {
    query = query.eq('seller_id', seller_id)
  }

  const { data, error } = await query

  if (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to get stats: ${error.message}`)
  }

  const stats = {
    total_auctions: data?.length || 0,
    active: 0,
    scheduled: 0,
    ended: 0,
    sold: 0,
    cancelled: 0,
    total_bids: 0,
    total_revenue: 0
  }

  data?.forEach((auction) => {
    switch (auction.status) {
      case 'active': stats.active++; break
      case 'scheduled': stats.scheduled++; break
      case 'ended': stats.ended++; break
      case 'sold':
        stats.sold++
        stats.total_revenue += auction.current_price
        break
      case 'cancelled': stats.cancelled++; break
    }
    stats.total_bids += auction.total_bids
  })

  return {
    content: [{ type: 'text', text: JSON.stringify({ seller_id: seller_id || 'all', stats }, null, 2) }]
  }
}

// ============================================================================
// SERVER START
// ============================================================================

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Miyo MCP Server running on stdio')
}

main().catch(console.error)
