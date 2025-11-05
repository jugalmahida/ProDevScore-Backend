import { OpenAI } from "openai";

const client = new OpenAI({
  baseURL: "https://api.perplexity.ai",
  apiKey: process.env.PERPLEXITY_API_KEY,
});

export const reviewCodeAndGetSummary = async (code) => {
  try {
    let chatCompletion;

    chatCompletion = await client.chat.completions.create({
      model: "sonar",
      messages: [
        {
          role: "user",
          content: `You are an expert software engineer and code reviewer. Carefully examine the following code diff which represents changes in a codebase.
Analyze the following aspects:
- Correctness (identify bugs or issues)
- Code style and formatting consistency
- Readability and clarity of the code
- Potential performance or security issues
- Best practices and maintainability
Provide an overall score out of 100 based on the code quality and significance of improvements or issues found. Be objective, balanced, and constructive when giving the score as this really matters for contributors.
Code Diff:
${code}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          schema: {
            type: "object",
            properties: {
              summary: {
                type: "string",
                description:
                  "Overall summary of the code review highlighting key points and observations. in max 2 lines.",
              },
              overall_score: {
                type: "integer",
                description: "Overall quality score of the code out of 100.",
                minimum: 0,
                maximum: 100,
              },
            },
            required: ["summary", "overall_score"],
          },
        },
      },
    });

    const content = chatCompletion.choices[0].message.content;
    // console.log("AI Response Content:", content);

    // Validate the response is not empty
    if (!content || content.trim() === "") {
      throw new Error("Empty response from AI");
    }
    return content;
  } catch (error) {
    console.error("Error in Code Reviewing:", error.message);
    throw error; // Re-throw to handle in controller
  }
};

// Using OpenRouter with free models
// import { OpenAI } from "openai";

// const client = new OpenAI({
//   baseURL: "https://openrouter.ai/api/v1",
//   apiKey: process.env.OPENROUTER_API_KEY,
// });

// export const reviewCodeandGetSummary = async (code) => {
//   try {
//     let chatCompletion;

//     chatCompletion = await client.chat.completions.create({
//       model: "deepseek/deepseek-chat-v3.1:free", //<- can switch the free models
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

// IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or additional text.

// Required JSON format:
// {
//   "overall_score": <number between 0-100>,
//   "summary": "<concise summary in max 2 lines>"
// }

// Code Diff:
// ${code}`,
//         },
//       ],

//       temperature: 0.7,
//       max_tokens: 500,
//     });

//     const content = chatCompletion.choices[0].message.content;
//     console.log("AI Response Content:", content);

//     // Validate the response is not empty
//     if (!content || content.trim() === "") {
//       throw new Error("Empty response from AI");
//     }

//     try {
//       return JSON.parse(content);
//     } catch {
//       throw new Error("Invalid JSON format from AI: " + content);
//     }
//   } catch (error) {
//     console.error("Error in Code Reviewing:", error.message);
//     throw error; // Re-throw to handle in controller
//   }
// };
