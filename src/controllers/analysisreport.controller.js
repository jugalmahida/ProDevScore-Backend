import { apiClient } from "../config/axios.config.js";
import { reviewCodeandGetSummary } from "../config/agent.config.js";
import { getIO } from "../config/socket.config.js";
import { AppError } from "../utils/AppError.js";
import { AppSuccess } from "../utils/AppSuccess.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const generateAnalysisScore = asyncHandler(async (req, res, next) => {
  const { githubUrl, login, topCommits, startDate, endDate, socketId } =
    req.body;

  if (!githubUrl || !login || !topCommits || !socketId) {
    return AppError.badRequest("Some fields are missing");
  }

  const commitsUrl = githubUrl.replace("https://github.com", "");
  let queryParams = `author=${login}&per_page=${topCommits}`;

  if (startDate) {
    const formattedStartDate = new Date(startDate).toISOString();
    queryParams += `&since=${formattedStartDate}`;
  }
  if (endDate) {
    const formattedEndDate = new Date(endDate).toISOString();
    queryParams += `&until=${formattedEndDate}`;
  }

  const commitsList = await apiClient.get(
    `/repos${commitsUrl}/commits?${queryParams}`
  );

  let filteredCommits = commitsList.data;

  if (startDate || endDate) {
    filteredCommits = filteredCommits.filter((commit) => {
      const commitDate = new Date(commit.commit.author.date);
      if (startDate && commitDate < new Date(startDate)) return false;
      if (endDate && commitDate > new Date(endDate)) return false;
      return true;
    });
  }

  if (filteredCommits.length === 0) {
    return AppError.notFound("No data found in given criteria", {
      success: true,
      message: "No data found in given criteria",
      githubUrl,
      login,
      topCommits,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    });
  }

  // Get Socket.IO instance
  const io = getIO();

  // Emit start event to specific client
  io.to(socketId).emit("reviewStarted", {
    total: filteredCommits.length,
    message: "Starting code review process..."
  });

  // Review commits one by one, emit progress to the client
  const reviewResults = [];

  for (let i = 0; i < filteredCommits.length; i++) {
    const commit = filteredCommits[i];
    try {
      const codeResp = await apiClient.get(commit.url, {
        headers: { Accept: "application/vnd.github.v3.diff" },
      });

      const reviewJsonStr = await reviewCodeandGetSummary(codeResp.data);
      const reviewJson = JSON.parse(reviewJsonStr);

      const reviewResult = {
        sha: commit.sha,
        review: reviewJson.summary || "No summary available",
        score: reviewJson.overall_score || null,
      };

      reviewResults.push(reviewResult);

      // Emit progress update to specific client
      io.to(socketId).emit("reviewProgress", {
        reviewed: i + 1,
        total: filteredCommits.length,
        currentCommit: {
          sha: commit.sha.substring(0, 7),
          message: commit.commit.message,
        },
        result: reviewResult,
        percentage: Math.round(((i + 1) / filteredCommits.length) * 100),
      });

      // console.log(`Reviewed commit ${i + 1}/${filteredCommits.length} for socket ${socketId}`);
    } catch (error) {
      console.error("Failed to parse review JSON:", error);
      
      const errorResult = {
        sha: commit.sha,
        review: `Error: Failed to parse AI response - ${error.message}`,
        score: null,
      };
      
      reviewResults.push(errorResult);

      // Emit error for this specific commit
      io.to(socketId).emit("reviewError", {
        reviewed: i + 1,
        total: filteredCommits.length,
        commit: commit.sha.substring(0, 7),
        error: error.message,
      });
    }
  }

  const validScores = reviewResults
    .map((r) => r.score)
    .filter((score) => score !== null && score !== undefined);

  const averageScore =
    validScores.length > 0
      ? Number(
          (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(
            2
          )
        )
      : null;

  // Emit final "done" event to specific client
  io.to(socketId).emit("reviewDone", {
    success: true,
    reviewResults,
    averageScore,
    totalReviewed: filteredCommits.length,
    validScoresCount: validScores.length,
  });

  // console.log(`Review completed for socket ${socketId}. Average score: ${averageScore}`);

  const data = {
    success: true,
    count: filteredCommits.length,
    dateRange: {
      startDate: startDate || null,
      endDate: endDate || null,
    },
    githubUrl,
    login,
    topCommits,
    reviews: reviewResults,
    averageScore,
  };

  AppSuccess.ok(data).send(res);
});

export const getContributorsData = asyncHandler(async (req, res, next) => {
  const { githubUrl } = req.body;

  if (!githubUrl) {
    return AppError.badRequest("Github Url is missing");
  }
  
  const contributorUrl = githubUrl.replace("https://github.com", "");
  const finalUrl = `/repos${contributorUrl}/contributors`;
  
  const response = await apiClient.get(finalUrl);
  AppSuccess.ok(response.data).send(res);
});

export const generateGridCommitsData = async () => {};