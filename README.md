# OpenAlex Cloudflare Worker API

A TypeScript-based Cloudflare Worker that provides a clean API wrapper for the [OpenAlex](https://openalex.org) scholarly database.

## Features

- ✅ Full OpenAlex API coverage (Works, Authors, Sources, Institutions, Topics, Publishers, Funders, Keywords, Geo)
- ✅ Advanced filtering, searching, and sorting
- ✅ Cursor and basic pagination
- ✅ Field selection and sampling
- ✅ Group-by aggregations
- ✅ Autocomplete endpoints
- ✅ TypeScript type definitions
- ✅ CORS-enabled
- ✅ Error handling
- ✅ Polite pool support

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)

### Installation

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Deploy to Cloudflare
npm run deploy
```

### Configuration

The worker uses the `OPENALEX_EMAIL` environment variable for the [polite pool](https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication). Set it in `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "OPENALEX_EMAIL": "your-email@example.com"
  }
}
```

## API Endpoints

### Base URL
- Local development: `http://localhost:8787`
- Production: `https://your-worker.workers.dev`

### Entities

All standard OpenAlex entities are supported:

- `/works` - Scholarly works (papers, articles, books, etc.)
- `/authors` - Author profiles
- `/sources` - Journals, conferences, repositories
- `/institutions` - Universities, research institutes
- `/topics` - Research topics
- `/publishers` - Academic publishers
- `/funders` - Funding organizations
- `/keywords` - Keywords
- `/geo` - Geographic data

### Endpoint Patterns

#### List Entities
```
GET /:entity?[query_params]
```

**Examples:**
```bash
# Get first 25 works
curl "http://localhost:8787/works"

# Get works with pagination
curl "http://localhost:8787/works?per_page=100&page=2"
```

#### Single Entity
```
GET /:entity/:id
```

**Examples:**
```bash
# Get work by OpenAlex ID
curl "http://localhost:8787/works/W2741809807"

# Get author by ID
curl "http://localhost:8787/authors/A5027479191"

# Get work by DOI
curl "http://localhost:8787/works/https://doi.org/10.7717/peerj.4375"
```

#### Random Entity
```
GET /:entity/random
```

**Examples:**
```bash
# Get random work
curl "http://localhost:8787/works/random"

# Get random author
curl "http://localhost:8787/authors/random"
```

#### Autocomplete
```
GET /autocomplete/:entity?q=query
```

**Examples:**
```bash
# Autocomplete institutions
curl "http://localhost:8787/autocomplete/institutions?q=harvard"

# Autocomplete authors
curl "http://localhost:8787/autocomplete/authors?q=einstein"
```

## Query Parameters

### Filtering (`filter`)

Filter entities by specific criteria:

```bash
# Open access works from 2023
curl "http://localhost:8787/works?filter=publication_year:2023,is_oa:true"

# Highly cited works (>100 citations)
curl "http://localhost:8787/works?filter=cited_by_count:>100"

# Authors from specific institution
curl "http://localhost:8787/authors?filter=last_known_institution.id:I136199984"

# Nested filters (works from Stanford by ROR)
curl "http://localhost:8787/works?filter=authorships.institutions.ror:00f54p054"
```

#### Filter Operators

- **Equality**: `field:value`
- **Inequality**: `field:>100`, `field:<50`
- **Negation**: `field:!value`
- **OR**: `field:value1|value2`
- **AND**: `field:value1,field:value2` or `field:value1+value2`

### Search (`search`)

Full-text search across relevant fields:

```bash
# Search works
curl "http://localhost:8787/works?search=machine%20learning"

# Search authors
curl "http://localhost:8787/authors?search=einstein"

# Boolean search
curl "http://localhost:8787/works?search=(quantum%20AND%20computing)%20NOT%20classical"
```

### Sort (`sort`)

Sort results by field (default: ascending, add `:desc` for descending):

```bash
# Most cited works from 2020
curl "http://localhost:8787/works?filter=publication_year:2020&sort=cited_by_count:desc"

# Alphabetical by title
curl "http://localhost:8787/works?sort=display_name"
```

**Sortable fields:**
- `cited_by_count`
- `works_count`
- `publication_date`
- `display_name`
- `relevance_score` (when searching)

### Pagination

#### Basic Pagination
```bash
# Page 2, 50 results per page
curl "http://localhost:8787/works?page=2&per_page=50"
```

**Limitations**: Only works for first 10,000 results.

#### Cursor Pagination
```bash
# First page (get cursor)
curl "http://localhost:8787/works?cursor=*&per_page=100"

# Next page (use next_cursor from response)
curl "http://localhost:8787/works?cursor=IlsxNjA5M...&per_page=100"
```

### Select Fields (`select`)

Return only specific fields:

```bash
# Get only id, doi, and title
curl "http://localhost:8787/works?select=id,doi,display_name"
```

### Sampling (`sample`)

Get random sample of results:

```bash
# 100 random works
curl "http://localhost:8787/works?sample=100&per_page=100"

# Reproducible random sample with seed
curl "http://localhost:8787/works?sample=50&seed=123&per_page=50"
```

### Group By (`group_by`)

Aggregate and count entities:

```bash
# Count works by type
curl "http://localhost:8787/works?group_by=type"

# Count works by publication year
curl "http://localhost:8787/works?group_by=publication_year"

# Count authors by country
curl "http://localhost:8787/authors?group_by=last_known_institution.country_code"
```

## Examples

### Complex Queries

#### Find highly-cited open access ML papers from 2023
```bash
curl "http://localhost:8787/works?\
filter=publication_year:2023,is_oa:true,cited_by_count:>10&\
search=machine%20learning&\
sort=cited_by_count:desc&\
per_page=10"
```

#### Get Stanford researchers working on climate
```bash
curl "http://localhost:8787/works?\
filter=authorships.institutions.ror:00f54p054&\
search=climate%20change&\
per_page=20"
```

#### Count works by institution country
```bash
curl "http://localhost:8787/works?\
filter=publication_year:2023&\
group_by=authorships.institutions.country_code"
```

### Response Format

#### Entity List Response
```json
{
  "meta": {
    "count": 246136992,
    "db_response_time_ms": 52,
    "page": 1,
    "per_page": 25,
    "next_cursor": "IlsxNjA5..."
  },
  "results": [
    {
      "id": "https://openalex.org/W2741809807",
      "doi": "https://doi.org/10.7717/peerj.4375",
      "title": "The state of OA...",
      "publication_year": 2018,
      "cited_by_count": 1008,
      ...
    }
  ]
}
```

#### Group By Response
```json
{
  "meta": {
    "count": 246136992,
    "db_response_time_ms": 271,
    "groups_count": 15
  },
  "group_by": [
    {
      "key": "article",
      "key_display_name": "article",
      "count": 202814957
    },
    ...
  ]
}
```

## Project Structure

```
.
├── src/
│   ├── types/
│   │   └── openalex.ts          # TypeScript type definitions
│   ├── utils/
│   │   ├── query-builder.ts     # URL construction utility
│   │   └── fetcher.ts           # HTTP client with error handling
│   ├── handlers/
│   │   └── entity-handler.ts    # Request handlers
│   ├── router.ts                # Request routing
│   └── index.ts                 # Worker entry point
├── test-api.ts                  # Test script
├── wrangler.jsonc               # Cloudflare config
├── package.json
└── tsconfig.json
```

## Testing

Run the test suite:

```bash
# Start the worker locally
npm run dev

# In another terminal, run tests
deno run --allow-net test-api.ts
```

Or test individual endpoints:

```bash
# Root info
curl http://localhost:8787/

# Search works
curl "http://localhost:8787/works?search=quantum&per_page=5"

# Get author
curl http://localhost:8787/authors/A5027479191
```

## Deployment

```bash
# Deploy to Cloudflare Workers
npm run deploy

# Your worker will be available at:
# https://openalex-worker.your-subdomain.workers.dev
```

## Resources

- [OpenAlex Documentation](https://docs.openalex.org)
- [OpenAlex Website](https://openalex.org)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)

## License

MIT

## Contributing

Contributions welcome! This worker aims to provide a clean, type-safe wrapper around the OpenAlex API.
