import { OpenAI } from "openai";
import {
  Agent,
  run,
  setDefaultOpenAIClient,
  setOpenAIAPI,
  setTracingDisabled,
} from "@openai/agents";
import { z } from "zod";

// Client for communicating with Perplexity AI
const perplexityClient = new OpenAI({
  baseURL: "https://api.perplexity.ai",
  apiKey: process.env.PERPLEXITY_API_KEY,
  maxRetries: 3,
});

// Disable OpenAI tracing for this module because we are using Perplexity AI
// Remove this line we using openai directly
setDefaultOpenAIClient(perplexityClient);
setOpenAIAPI("chat_completions");
setTracingDisabled(true);

// For structured output
const CodeReviewEvent = z.object({
  summary: z
    .string()
    .describe(
      "Overall summary of the code review highlighting key points and observations. Max 2 lines."
    ),
  overall_score: z
    .number()
    .describe("Overall quality score of the code out of 100")
    .min(0)
    .max(100),
});

// Main Agent for code review & get score
const agent = new Agent({
  name: "Code Reviewer Agent",
  model: "sonar",
  instructions: `
  You are an expert software engineer and code reviewer. Carefully examine the following code diff which represents changes in a codebase. Analyze the this aspects: 1. Correctness (identify bugs or issues, 2.Code style and formatting consistency, 3.Readability and clarity of the code, 4.Potential performance or security issues and 5.Best practices and maintainability. Provide an overall score out of 100 based on the code quality and significance of improvements or issues found. Be objective, balanced, and constructive when giving the score as this really matters for contributors. Avoid generic advice or commentary outside the code context.
  `,
  outputType: CodeReviewEvent,
});

export const reviewCodeAndGetSummary = async (code) => {
  try {
    const response = await run(agent, code, { max_output_tokens: 512 });
    // console.log(response);
    return response.finalOutput;
  } catch (error) {
    console.error("Error in Code Reviewing:", error.message);
    throw null;
  }
};

// When using openai directly (chat.completions.create)
// export const reviewCodeAndGetSummary = async (code) => {
//   try {
//     let chatCompletion;

//     chatCompletion = await client.chat.completions.create({
//       model: "sonar",
//       messages: [
//         {
//           role: "user",
//           content: `You are an expert software engineer and code reviewer. Carefully examine the following code diff which represents changes in a codebase.
// Analyze the following aspects:
// - Correctness (identify bugs or issues)
// - Code style and formatting consistency
// - Readability and clarity of the code
// - Potential performance or security issues
// - Best practices and maintainability
// Provide an overall score out of 100 based on the code quality and significance of improvements or issues found. Be objective, balanced, and constructive when giving the score as this really matters for contributors.
// Code Diff:
// ${code}`,
//         },
//       ],
//       response_format: {
//         type: "json_schema",
//         json_schema: {
//           schema: {
//             type: "object",
//             properties: {
//               summary: {
//                 type: "string",
//                 description:
//                   "Overall summary of the code review highlighting key points and observations. in max 2 lines.",
//               },
//               overall_score: {
//                 type: "integer",
//                 description: "Overall quality score of the code out of 100.",
//                 minimum: 0,
//                 maximum: 100,
//               },
//             },
//             required: ["summary", "overall_score"],
//           },
//         },
//       },
//     });

//     const content = chatCompletion.choices[0].message.content;
//     // console.log("AI Response Content:", content);

//     // Validate the response is not empty
//     if (!content || content.trim() === "") {
//       throw new Error("Empty response from AI");
//     }
//     return content;
//   } catch (error) {
//     console.error("Error in Code Reviewing:", error.message);
//     throw error; // Re-throw to handle in controller
//   }
// };
