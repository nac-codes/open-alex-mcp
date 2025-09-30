# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Model Context Protocol (MCP) server deployed as a Cloudflare Worker that provides AI agents with access to the OpenAlex scholarly database. The server exposes research tools for searching works, authors, and institutions through the MCP protocol.

## Development Commands

```bash
# Start local development server (runs on http://localhost:8787)
npm run dev

# Deploy to Cloudflare Workers
npm run deploy

# Format code with Biome
npm run format

# Lint and auto-fix with Biome
npm run lint:fix

# Type check without emitting
npm run type-check

# Generate Cloudflare Worker types
npm run cf-typegen
```

## Architecture

### MCP Server on Cloudflare Workers

The server is built using Cloudflare's Durable Objects pattern for stateful MCP connections:

- **Entry Point** (`src/index.ts:205-219`): The default export handles HTTP requests and routes to appropriate MCP endpoints
- **SSE Endpoint** (`/sse`): Server-Sent Events transport for MCP clients (used by Claude Desktop via mcp-remote)
- **MCP Endpoint** (`/mcp`): Standard MCP JSON-RPC transport
- **OpenAlexMCP Class** (`src/index.ts:13-203`): Extends `McpAgent` from the `agents/mcp` package, implementing the MCP server as a Durable Object

### Three-Layer Data Flow

1. **MCP Tools Layer** (`src/index.ts:19-201`): Defines MCP tools with Zod schemas for parameters
   - Tools call QueryBuilder to construct OpenAlex API URLs
   - Tools use the singleton fetcher to make HTTP requests
   - Results are returned as JSON-formatted MCP content

2. **Query Builder Layer** (`src/utils/query-builder.ts`): Constructs OpenAlex API URLs
   - `QueryBuilder.buildFromParams()` is the primary static method used by tools
   - Supports filters, search, sorting, pagination (basic and cursor), field selection, sampling, and grouping
   - `buildRandomUrl()` creates URLs for random entity endpoints (though not currently exposed as tools)

3. **Fetcher Layer** (`src/utils/fetcher.ts`): HTTP client with error handling
   - Singleton instance `fetcher` exported for convenience
   - 30-second timeout on all requests
   - Custom `OpenAlexError` class preserves status codes and response bodies
   - Typed methods: `fetchEntity()`, `fetchList()`, `fetchGroupBy()`

### Type Definitions

All OpenAlex types are defined in `src/types/openalex.ts`:
- `EntityType`: Union type of all supported OpenAlex entities (works, authors, institutions, etc.)
- `QueryParams`: Interface for all supported OpenAlex query parameters
- `OpenAlexResponse<T>`: Generic response wrapper with metadata
- `GroupByResponse`: Response format for aggregation queries

## Configuration

### Environment Variables

Configure in `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "OPENALEX_EMAIL": "your-email@example.com"  // For OpenAlex polite pool (higher rate limits)
  }
}
```

The email is automatically added to all OpenAlex API requests via the `mailto` parameter.

### Durable Objects Setup

The `wrangler.jsonc` file configures the OpenAlexMCP class as a Durable Object:

```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "class_name": "OpenAlexMCP",
        "name": "MCP_OBJECT"
      }
    ]
  },
  "migrations": [
    {
      "new_sqlite_classes": ["OpenAlexMCP"],
      "tag": "v1"
    }
  ]
}
```

## Adding New MCP Tools

To add a new tool, define it in the `init()` method of the `OpenAlexMCP` class in `src/index.ts`:

```typescript
this.server.tool(
  "tool_name",
  {
    param1: z.string().describe("Parameter description"),
    param2: z.number().optional().describe("Optional parameter")
  },
  async ({ param1, param2 }) => {
    try {
      const mailto = (this.env as Env)?.OPENALEX_EMAIL;
      const params = { search: param1, per_page: param2, mailto };

      const apiUrl = QueryBuilder.buildFromParams("entity_type", params);
      const data = await fetcher.fetchList(apiUrl);

      return {
        content: [{
          type: "text",
          text: JSON.stringify(data, null, 2)
        }]
      };
    } catch (error) {
      const errorMsg = error instanceof OpenAlexError
        ? `OpenAlex API Error: ${error.message}`
        : `Error: ${String(error)}`;
      return {
        content: [{ type: "text", text: errorMsg }]
      };
    }
  }
);
```

### Current Tools

- `search_works`: Search for papers, articles, books
- `search_authors`: Search for author profiles
- `search_institutions`: Search for universities, research institutes
- `get_work_by_id`: Get detailed work information by OpenAlex ID or DOI
- `get_author_by_id`: Get detailed author information by OpenAlex ID or ORCID

## Connecting to the MCP Server

### Claude Desktop (via mcp-remote)

Add to Claude Desktop config (`Settings > Developer > Edit Config`):

```json
{
  "mcpServers": {
    "openalex": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/sse"
      ]
    }
  }
}
```

For production: Replace `http://localhost:8787/sse` with your deployed Worker URL (e.g., `https://openalex-mcp-server.your-account.workers.dev/sse`)

### Cloudflare AI Playground

1. Go to https://playground.ai.cloudflare.com/
2. Enter your deployed MCP server URL
3. Use the tools directly in the playground

## OpenAlex API Integration

### Entity Types

The server supports all OpenAlex entity types (defined in `EntityType` union):
- `works`: Scholarly works (papers, articles, books)
- `authors`: Author profiles
- `institutions`: Universities, research institutes
- `sources`: Journals, conferences, repositories
- `topics`: Research topics
- `publishers`: Academic publishers
- `funders`: Funding organizations
- `keywords`: Keywords
- `geo`: Geographic data

### Query Parameters

OpenAlex supports rich querying (all implemented in `QueryBuilder`):

- **filter**: Field-based filtering (e.g., `publication_year:2023,is_oa:true`)
  - Operators: equality, inequality (>/<), negation (!), OR (|), AND (,)
- **search**: Full-text search across relevant fields
- **sort**: Sort by field (e.g., `cited_by_count:desc`)
- **per_page**: Results per page (default 10, max 200)
- **page**: Basic pagination (limited to first 10,000 results)
- **cursor**: Cursor-based pagination (unlimited results)
- **select**: Return only specific fields (e.g., `id,doi,display_name`)
- **sample**: Random sampling with optional seed for reproducibility
- **group_by**: Aggregate and count entities by field

### API Documentation

Full OpenAlex API docs: https://docs.openalex.org
