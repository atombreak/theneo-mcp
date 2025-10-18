import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Tool for listing Postman collections
 */
export const ListPostmanCollectionsTool: Tool = {
  name: "theneo_list_postman_collections",
  description: "List all Postman collections accessible with the provided Postman API key.",
  inputSchema: {
    type: "object",
    properties: {
      postmanApiKey: { type: "string", description: "Postman API key" },
    },
    required: ["postmanApiKey"],
  },
};

