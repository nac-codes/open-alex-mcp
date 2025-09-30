# OpenAlex MCP Server

A Model Context Protocol (MCP) server that provides AI agents with access to the [OpenAlex](https://openalex.org) scholarly database. This server enables AI assistants like Claude and ChatGPT to search for academic papers, authors, and institutions directly through natural language queries.

## Features

- 🔍 **Search academic works** - Find papers, articles, and books with full-text search and advanced filtering
- 👤 **Author lookup** - Search for researchers and get detailed author profiles
- 🏛️ **Institution search** - Find universities, research institutes, and their publications
- 📄 **Detailed metadata** - Access comprehensive information about works and authors by ID
- ⚡ **High performance** - Deployed as a Cloudflare Worker with global edge distribution
- 🔓 **No authentication** - Open access, ready to use immediately

## Quick Start

### Option 1: Use the Public Server

The server is deployed and ready to use at:
```
https://openalex-mcp-server.nchimicles.workers.dev/mcp
```

No authentication required - just add it to your AI client!

### Option 2: Deploy Your Own

```bash
# Clone the repository
git clone https://github.com/nac-codes/open-alex-mcp.git
cd open-alex-mcp

# Install dependencies
npm install

# Configure your email for OpenAlex polite pool (optional but recommended)
# Edit wrangler.jsonc and set your email in the "vars" section

# Deploy to your Cloudflare account
npm run deploy
```

## Connecting to AI Clients

### Claude (claude.ai)

1. Go to your Claude project or chat
2. Click on the connector/integrations icon
3. Add a new MCP server
4. Enter the server URL:
   ```
   https://openalex-mcp-server.nchimicles.workers.dev/mcp
   ```
5. No authentication required - just connect and start using!

### ChatGPT (openai.com)

1. Enable Developer Mode in ChatGPT settings (at the time of writing, this feature requires developer mode)
2. Add a new MCP connector
3. Enter the server URL:
   ```
   https://openalex-mcp-server.nchimicles.workers.dev/mcp
   ```
4. Connect and start using the OpenAlex research tools

## Testing Locally

You can test the MCP server locally using the official MCP inspector:

```bash
npx @modelcontextprotocol/inspector
```

This will:
1. Start a proxy server (typically on `localhost:6277`)
2. Generate a session token for authentication
3. Open the MCP Inspector in your browser
4. Allow you to test all available tools interactively

When prompted, start your local server with `npm run dev` and connect to it through the inspector.

## Available Tools

### 1. `search_works`

Search for scholarly works (papers, articles, books) with flexible filtering and sorting.

**Parameters:**
- `query` (string, required) - Search query
- `filter` (string, optional) - Filter string (e.g., `publication_year:2023,is_oa:true`)
- `sort` (string, optional) - Sort field (e.g., `cited_by_count:desc`)
- `per_page` (number, optional) - Results per page (default: 10, max: 200)

**Example usage in Claude:**
- "Find recent papers about quantum computing"
- "Search for open access papers on machine learning published in 2023"
- "Find the most cited papers on climate change"

### 2. `search_authors`

Search for author profiles and researchers.

**Parameters:**
- `query` (string, required) - Search query for author name or keywords
- `filter` (string, optional) - Filter string (e.g., `last_known_institution.id:I136199984`)
- `sort` (string, optional) - Sort field (e.g., `works_count:desc`)
- `per_page` (number, optional) - Results per page (default: 10, max: 200)

**Example usage in Claude:**
- "Find authors who study artificial intelligence"
- "Search for researchers at Stanford University"
- "Who are the most prolific authors in neuroscience?"

### 3. `search_institutions`

Search for universities, research institutes, and academic organizations.

**Parameters:**
- `query` (string, required) - Search query for institution name
- `filter` (string, optional) - Filter string (e.g., `country_code:US`)
- `sort` (string, optional) - Sort field (e.g., `works_count:desc`)
- `per_page` (number, optional) - Results per page (default: 10, max: 200)

**Example usage in Claude:**
- "Find top research institutions in the United States"
- "Search for universities working on renewable energy"

### 4. `get_work_by_id`

Get detailed information about a specific work by its OpenAlex ID or DOI.

**Parameters:**
- `work_id` (string, required) - OpenAlex work ID (e.g., `W2741809807`) or DOI

**Example usage in Claude:**
- "Get details for work W2741809807"
- "Show me information about DOI 10.1038/nature12373"

### 5. `get_author_by_id`

Get detailed information about an author by their OpenAlex ID or ORCID.

**Parameters:**
- `author_id` (string, required) - OpenAlex author ID (e.g., `A5027479191`) or ORCID

**Example usage in Claude:**
- "Get details for author A5027479191"
- "Show me information about ORCID 0000-0001-6187-6610"

## Development

### Commands

```bash
# Start local development server
npm run dev

# Deploy to Cloudflare Workers
npm run deploy

# Format code
npm run format

# Lint and auto-fix
npm run lint:fix

# Type check
npm run type-check
```

### Configuration

#### OpenAlex Polite Pool

For higher rate limits, configure your email in `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "OPENALEX_EMAIL": "your-email@example.com"
  }
}
```

This email is automatically included in all OpenAlex API requests via the `mailto` parameter, giving you access to the [polite pool](https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication) with higher rate limits.

### Adding New Tools

To add a new MCP tool, define it in the `init()` method of the `OpenAlexMCP` class in `src/index.ts`:

```typescript
this.server.tool(
  "tool_name",
  {
    param: z.string().describe("Parameter description")
  },
  async ({ param }) => {
    try {
      const mailto = (this.env as Env)?.OPENALEX_EMAIL;
      const params = { search: param, mailto };
      const apiUrl = QueryBuilder.buildFromParams("works", params);
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

## Deployment

### Deploy Your Own Instance

1. Install [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
2. Authenticate with Cloudflare: `wrangler login`
3. Deploy: `npm run deploy`

Your MCP server will be deployed to a URL like: `https://openalex-mcp-server.your-account.workers.dev`

Use the `/mcp` endpoint to connect from AI clients (e.g., `https://your-server.workers.dev/mcp`)

## OpenAlex Query Capabilities

The server supports powerful querying through OpenAlex's API:

### Filtering

Use the `filter` parameter for precise queries:

```
publication_year:2023,is_oa:true              # Open access papers from 2023
cited_by_count:>100                           # Papers with >100 citations
publication_year:2020-2023                    # Range query
authorships.institutions.ror:00f54p054        # Papers from specific institution
type:article,is_oa:true                       # Open access articles only
```

**Filter operators:**
- `:` - Equals
- `:>` / `:<` - Greater/less than
- `:!` - Not equals
- `|` - OR
- `,` - AND

### Sorting

Sort results by any field:

```
cited_by_count:desc        # Most cited first
publication_date:desc      # Most recent first
relevance_score:desc       # Most relevant (when searching)
```

### Pagination

Two pagination methods are supported:

**Basic pagination** (up to 10,000 results):
```
page=1&per_page=50
```

**Cursor pagination** (unlimited):
```
cursor=*               # First page
cursor=IlsxNjA5M...    # Next page (from response)
```

## Project Structure

```
src/
├── index.ts                 # MCP server entry point and tool definitions
├── types/
│   └── openalex.ts         # TypeScript type definitions
└── utils/
    ├── query-builder.ts    # OpenAlex URL construction
    └── fetcher.ts          # HTTP client with error handling
```

### Architecture

1. **MCP Tools Layer** - Defines tools with Zod schemas for validation
2. **Query Builder** - Constructs OpenAlex API URLs with filters and parameters
3. **Fetcher** - Handles HTTP requests with timeouts and error handling

The server is deployed as a Cloudflare Durable Object for stateful MCP connections, with SSE and JSON-RPC transport support.

## Resources

- [OpenAlex API Documentation](https://docs.openalex.org)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)

## License

MIT

## Contributing

Contributions are welcome! This server provides a foundation for integrating AI agents with scholarly research databases.
