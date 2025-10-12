import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { QueryBuilder } from "./utils/query-builder";
import { fetcher, OpenAlexError } from "./utils/fetcher";

// Environment interface with OpenAlex email
interface Env {
	OPENALEX_EMAIL?: string;
}

// Define our OpenAlex MCP agent with research tools
export class OpenAlexMCP extends McpAgent {
	server = new McpServer({
		name: "OpenAlex Research",
		version: "1.0.0",
	});

	async init() {
		// Search for academic works/papers
		this.server.tool(
			"search_works",
			{
				query: z.string().describe("Search query for works (papers, articles, etc.)"),
				filter: z.string().optional().describe("Filter string (e.g., 'publication_year:2023,is_oa:true')"),
				sort: z.string().optional().describe("Sort field (e.g., 'cited_by_count:desc')"),
				per_page: z.number().optional().default(10).describe("Number of results per page (default: 10, max: 200)"),
				verbose: z.boolean().optional().default(false).describe("Return full details (default: false, returns concise results)"),
			},
			async ({ query, filter, sort, per_page, verbose }) => {
				try {
					const mailto = (this.env as Env)?.OPENALEX_EMAIL;

					// Concise mode by default - only return essential fields
					const select = verbose ? undefined : "id,doi,display_name,publication_year,publication_date,authorships,open_access,cited_by_count,primary_topic,biblio";

					const params = {
						search: query,
						filter,
						sort,
						per_page,
						select,
						mailto,
					};

					const apiUrl = QueryBuilder.buildFromParams("works", params);
					const data = await fetcher.fetchList(apiUrl);

					return {
						content: [{
							type: "text",
							text: JSON.stringify(data, null, 2)
						}],
					};
				} catch (error) {
					const errorMsg = error instanceof OpenAlexError
						? `OpenAlex API Error: ${error.message}`
						: `Error: ${String(error)}`;
					return {
						content: [{ type: "text", text: errorMsg }],
					};
				}
			}
		);

		// Search for authors
		this.server.tool(
			"search_authors",
			{
				query: z.string().describe("Search query for authors"),
				filter: z.string().optional().describe("Filter string (e.g., 'last_known_institution.id:I136199984')"),
				sort: z.string().optional().describe("Sort field (e.g., 'works_count:desc')"),
				per_page: z.number().optional().default(10).describe("Number of results per page (default: 10, max: 200)"),
				verbose: z.boolean().optional().default(false).describe("Return full details (default: false, returns concise results)"),
			},
			async ({ query, filter, sort, per_page, verbose }) => {
				try {
					const mailto = (this.env as Env)?.OPENALEX_EMAIL;

					// Concise mode by default - only return essential fields
					const select = verbose ? undefined : "id,display_name,orcid,works_count,cited_by_count,last_known_institutions";

					const params = {
						search: query,
						filter,
						sort,
						per_page,
						select,
						mailto,
					};

					const apiUrl = QueryBuilder.buildFromParams("authors", params);
					const data = await fetcher.fetchList(apiUrl);

					return {
						content: [{
							type: "text",
							text: JSON.stringify(data, null, 2)
						}],
					};
				} catch (error) {
					const errorMsg = error instanceof OpenAlexError
						? `OpenAlex API Error: ${error.message}`
						: `Error: ${String(error)}`;
					return {
						content: [{ type: "text", text: errorMsg }],
					};
				}
			}
		);

		// Search for institutions
		this.server.tool(
			"search_institutions",
			{
				query: z.string().describe("Search query for institutions (universities, research institutes)"),
				filter: z.string().optional().describe("Filter string (e.g., 'country_code:US')"),
				sort: z.string().optional().describe("Sort field (e.g., 'works_count:desc')"),
				per_page: z.number().optional().default(10).describe("Number of results per page (default: 10, max: 200)"),
				verbose: z.boolean().optional().default(false).describe("Return full details (default: false, returns concise results)"),
			},
			async ({ query, filter, sort, per_page, verbose }) => {
				try {
					const mailto = (this.env as Env)?.OPENALEX_EMAIL;

					// Concise mode by default - only return essential fields
					const select = verbose ? undefined : "id,display_name,country_code,works_count,cited_by_count,type";

					const params = {
						search: query,
						filter,
						sort,
						per_page,
						select,
						mailto,
					};

					const apiUrl = QueryBuilder.buildFromParams("institutions", params);
					const data = await fetcher.fetchList(apiUrl);

					return {
						content: [{
							type: "text",
							text: JSON.stringify(data, null, 2)
						}],
					};
				} catch (error) {
					const errorMsg = error instanceof OpenAlexError
						? `OpenAlex API Error: ${error.message}`
						: `Error: ${String(error)}`;
					return {
						content: [{ type: "text", text: errorMsg }],
					};
				}
			}
		);

		// Search for sources (journals, repositories, conferences, etc.)
		this.server.tool(
			"search_sources",
			{
				query: z.string().describe("Search query for sources (journals, repositories, conferences)"),
				filter: z.string().optional().describe("Filter string (e.g., 'type:journal', 'is_oa:true')"),
				sort: z.string().optional().describe("Sort field (e.g., 'works_count:desc')"),
				per_page: z.number().optional().default(10).describe("Number of results per page (default: 10, max: 200)"),
				verbose: z.boolean().optional().default(false).describe("Return full details (default: false, returns concise results)"),
			},
			async ({ query, filter, sort, per_page, verbose }) => {
				try {
					const mailto = (this.env as Env)?.OPENALEX_EMAIL;

					// Concise mode by default - only return essential fields
					const select = verbose ? undefined : "id,display_name,type,host_organization_name,works_count,cited_by_count,is_oa,country_code";

					const params = {
						search: query,
						filter,
						sort,
						per_page,
						select,
						mailto,
					};

					const apiUrl = QueryBuilder.buildFromParams("sources", params);
					const data = await fetcher.fetchList(apiUrl);

					return {
						content: [{
							type: "text",
							text: JSON.stringify(data, null, 2)
						}],
					};
				} catch (error) {
					const errorMsg = error instanceof OpenAlexError
						? `OpenAlex API Error: ${error.message}`
						: `Error: ${String(error)}`;
					return {
						content: [{ type: "text", text: errorMsg }],
					};
				}
			}
		);

		// Get detailed information about a specific work by ID
		this.server.tool(
			"get_work_by_id",
			{
				work_id: z.string().describe("OpenAlex work ID (e.g., 'W2741809807') or DOI"),
			},
			async ({ work_id }) => {
				try {
					const mailto = (this.env as Env)?.OPENALEX_EMAIL;
					const params = { mailto };

					const apiUrl = QueryBuilder.buildFromParams("works", params, work_id);
					const data = await fetcher.fetchEntity(apiUrl);

					return {
						content: [{
							type: "text",
							text: JSON.stringify(data, null, 2)
						}],
					};
				} catch (error) {
					const errorMsg = error instanceof OpenAlexError
						? `OpenAlex API Error: ${error.message}`
						: `Error: ${String(error)}`;
					return {
						content: [{ type: "text", text: errorMsg }],
					};
				}
			}
		);

		// Get detailed information about an author by ID
		this.server.tool(
			"get_author_by_id",
			{
				author_id: z.string().describe("OpenAlex author ID (e.g., 'A5027479191') or ORCID"),
			},
			async ({ author_id }) => {
				try {
					const mailto = (this.env as Env)?.OPENALEX_EMAIL;
					const params = { mailto };

					const apiUrl = QueryBuilder.buildFromParams("authors", params, author_id);
					const data = await fetcher.fetchEntity(apiUrl);

					return {
						content: [{
							type: "text",
							text: JSON.stringify(data, null, 2)
						}],
					};
				} catch (error) {
					const errorMsg = error instanceof OpenAlexError
						? `OpenAlex API Error: ${error.message}`
						: `Error: ${String(error)}`;
					return {
						content: [{ type: "text", text: errorMsg }],
					};
				}
			}
		);

		// Get detailed information about a source by ID
		this.server.tool(
			"get_source_by_id",
			{
				source_id: z.string().describe("OpenAlex source ID (e.g., 'S137773608') or ISSN"),
			},
			async ({ source_id }) => {
				try {
					const mailto = (this.env as Env)?.OPENALEX_EMAIL;
					const params = { mailto };

					const apiUrl = QueryBuilder.buildFromParams("sources", params, source_id);
					const data = await fetcher.fetchEntity(apiUrl);

					return {
						content: [{
							type: "text",
							text: JSON.stringify(data, null, 2)
						}],
					};
				} catch (error) {
					const errorMsg = error instanceof OpenAlexError
						? `OpenAlex API Error: ${error.message}`
						: `Error: ${String(error)}`;
					return {
						content: [{ type: "text", text: errorMsg }],
					};
				}
			}
		);

	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return OpenAlexMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return OpenAlexMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
