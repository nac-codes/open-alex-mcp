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

- `search_works`: Search for papers, articles, books (supports `verbose` parameter)
- `search_authors`: Search for author profiles (supports `verbose` parameter)
- `search_institutions`: Search for universities, research institutes (supports `verbose` parameter)
- `search_sources`: Search for journals, repositories, conferences (supports `verbose` parameter)
- `get_work_by_id`: Get detailed work information by OpenAlex ID or DOI
- `get_author_by_id`: Get detailed author information by OpenAlex ID or ORCID
- `get_source_by_id`: Get detailed source information by OpenAlex ID or ISSN

## Concise Mode (Default Behavior)

**All search tools default to concise mode** to reduce API response size and conserve AI context windows. This is a critical optimization for AI agents working with large result sets.

### How It Works

- By default (`verbose=false`), search tools return only essential fields via OpenAlex's `select` parameter
- AI clients must explicitly set `verbose=true` to receive full entity details
- The `get_*_by_id` tools always return full details (no verbose parameter)

### Concise Field Sets

**search_works** (concise):
```
id,doi,display_name,publication_year,publication_date,authorships,open_access,cited_by_count,primary_topic,biblio
```

**search_authors** (concise):
```
id,display_name,orcid,works_count,cited_by_count,last_known_institutions
```

**search_institutions** (concise):
```
id,display_name,country_code,works_count,cited_by_count,type
```

**search_sources** (concise):
```
id,display_name,type,host_organization_name,works_count,cited_by_count,is_oa,country_code
```

### Implementation Example

When adding a new search tool, follow this pattern:

```typescript
this.server.tool(
  "search_entity",
  {
    query: z.string().describe("Search query"),
    verbose: z.boolean().optional().default(false).describe("Return full details (default: false, returns concise results)"),
  },
  async ({ query, verbose }) => {
    const mailto = (this.env as Env)?.OPENALEX_EMAIL;

    // Concise mode by default - only return essential fields
    const select = verbose ? undefined : "id,display_name,field1,field2";

    const params = { search: query, select, mailto };
    const apiUrl = QueryBuilder.buildFromParams("entity_type", params);
    const data = await fetcher.fetchList(apiUrl);

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
);
```

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

### Sources Breakdown

OpenAlex contains **260,788 sources** (as of 2025-10) broken down by type:
- **Journals**: 209,798 (80.5%)
- **Ebook Platforms**: 28,966 (11.1%)
- **Conferences**: 10,939 (4.2%)
- **Book Series**: 6,978 (2.7%)
- **Repositories**: 3,979 (1.5%)
- **Other**: 120
- **Metadata**: 2

Query examples:
- All journals: `filter=type:journal`
- Open access repositories: `filter=type:repository,is_oa:true`
- High-impact journals: `filter=type:journal&sort=cited_by_count:desc`

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
