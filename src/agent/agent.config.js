import { OpenAI } from "openai";
import {
  Agent,
  InputGuardrailTripwireTriggered,
  OutputGuardrailTripwireTriggered,
  run,
  setDefaultOpenAIClient,
  setOpenAIAPI,
  setTracingDisabled,
} from "@openai/agents";

import {
  CodeReviewEvent,
  InputGuardrailEvent,
  OutputGuardrailEvent,
} from "../agent/zod/CodeReview.js";

// Client for communicating with Perplexity AI
const perplexityClient = new OpenAI({
  baseURL: "https://api.perplexity.ai",
  apiKey: process.env.PERPLEXITY_API_KEY,
  maxRetries: 3,
});

// Disable OpenAI tracing for this module because we are using Perplexity AI
// Remove following lines we using openai directly
setDefaultOpenAIClient(perplexityClient);
setOpenAIAPI("chat_completions");
setTracingDisabled(true);

// Input guardrail Agent
const codeReviewInputGuardrailAgent = new Agent({
  name: "Input Guardrail For Code Review",
  model: "sonar",
  instructions: `
    Ensure that the input is a valid GitHub diff. 
    Check the format and structure of the input to verify that it adheres to GitHub's diff format. 
    If the input is not a diff, return an error or flag the input for review.
    The diff should contain added (+) and removed (-) lines, and proper commit metadata (e.g., commit hashes, filenames).
    Reject any non-diff input such as plain text or code without a diff context.
  `,
  outputType: InputGuardrailEvent,
});

// Input guardrail
const codeReviewInputGuardrail = {
  name: "Code Review Guardrail Check",
  execute: async ({ input }) => {
    const result = await run(codeReviewInputGuardrailAgent, input);
    return {
      outputInfo: result.finalOutput,
      tripwireTriggered: !result.finalOutput?.isCodeReview,
    };
  },
};

// Output guardrail Agent
const codeReviewOutputGuardrailAgent = new Agent({
  name: "Output Guardrail For Code Review",
  model: "sonar",
  instructions: `
    Validate that the output matches:
      summary: string (concise, based primarily on the provided diff),
      overall_score: number 0-100
    Rules:
    - Summary should be brief and mainly reflect the diff.
    - No extra fields, no markdown, no explanations.
    - overall_score must be numeric and within range.
    - Flag output as invalid if any rule is violated.
  `,
  outputType: OutputGuardrailEvent,
});

// Output guardrail
const codeReviewOutputGuardrail = {
  name: "Code Review Output Guardrail Check",
  execute: async ({ agentOutput }) => {
    // console.log("Agent output - " + JSON.stringify(agentOutput));

    const result = await run(
      codeReviewOutputGuardrailAgent,
      JSON.stringify(agentOutput)
    );
    return {
      outputInfo: result.finalOutput.reasoning,
      tripwireTriggered: !result.finalOutput.isSafe,
    };
  },
};

// Main Agent for code review & get score
const agent = new Agent({
  name: "Code Reviewer Agent",
  model: "sonar",
  instructions: `
  You are an expert software engineer and code reviewer. Carefully examine the following code diff which represents changes in a codebase. Analyze the this aspects: 1. Correctness (identify bugs or issues, 2.Code style and formatting consistency, 3.Readability and clarity of the code, 4.Potential performance or security issues and 5.Best practices and maintainability. Provide an overall score out of 100 based on the code quality and significance of improvements or issues found. Be objective, balanced, and constructive when giving the score as this really matters for contributors.Provide Overall summary in max 2 lines & small. Avoid generic advice or commentary outside the code context.
  `,
  outputType: CodeReviewEvent,
  inputGuardrails: [codeReviewInputGuardrail],
  outputGuardrails: [codeReviewOutputGuardrail],
});

export const reviewCodeAndGetSummary = async (code) => {
  try {
    const response = await run(agent, code, { max_output_tokens: 512 });
    // console.log(response);
    return response.finalOutput;
  } catch (error) {
    if (error instanceof OutputGuardrailTripwireTriggered) {
      console.error("Error - agent output is out of context: ", error.message);
      throw null;
    } else if (error instanceof InputGuardrailTripwireTriggered) {
      console.error("Error - User input is out of context: ", error.message);
      throw null;
    } else {
      console.error("Error in Code Reviewing:", error.message);
      throw null;
    }
  }
};
