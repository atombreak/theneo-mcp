import { Theneo } from "@theneo/sdk";
import { logger } from "../../utils/logger.js";

/**
 * Handler for listing Postman collections
 */
export async function handleListPostmanCollections(args: { postmanApiKey: string }) {
  const { postmanApiKey } = args;

  if (!postmanApiKey) {
    return {
      content: [
        {
          type: "text",
          text: "Error: postmanApiKey is required",
        },
      ],
    };
  }

  logger.info("Listing Postman collections");

  const result = await Theneo.listPostmanCollections(postmanApiKey);

  if (!result.ok) {
    const error = result.error;
    logger.error("Failed to list Postman collections", { error });
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error?.message || "Failed to list Postman collections"}`,
        },
      ],
    };
  }

  const collections = result.value;
  logger.info("Postman collections listed successfully");
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(collections, null, 2),
      },
    ],
  };
}

