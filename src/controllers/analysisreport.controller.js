import { apiClient } from "../config/axios.config.js";
import { reviewCodeAndGetSummary } from "../agent/agent.config.js";
import { getIO } from "../config/socket.config.js";
import { AppError } from "../utils/AppError.js";
import { AppSuccess } from "../utils/AppSuccess.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { UserSubscriptions } from "../models/usersubscriptions.model.js";

export const generateAnalysisScore = asyncHandler(async (req, res, next) => {
  const { githubUrl, login, topCommits, startDate, endDate, socketId } =
    req.body;

  if (!githubUrl || !login || !topCommits || !socketId) {
    return next(AppError.badRequest("Some fields are missing"));
  }

  // Fetch user subscription and pricing plan
  const userSubscription = await UserSubscriptions.findOne({
    userId: req.user._id,
  })
    .select("currentPlan endDate currentUsage")
    .populate("currentPlan");

  if (!userSubscription) {
    return next(AppError.notFound("User subscription not found"));
  }

  // Check if subscription is active
  const now = new Date();
  if (now > new Date(userSubscription.endDate)) {
    return next(AppError.forbidden("Subscription has expired"));
  }

  const plan = userSubscription.currentPlan;
  const contributorsLimit = plan?.limits?.contributors ?? 0;
  const commitsPerContributorLimit = plan?.limits?.commitsPerContributor ?? 0;
  const totalCommitLimit =
    (plan?.limits?.contributors ?? 0) *
    (plan?.limits?.commitsPerContributor ?? 0);

  // Normalize repo and contributor keys
  let repoFull;
  try {
    const u = new URL(githubUrl);
    const path = u.pathname.replace(/\.git$/i, "");
    const [owner, repo] = path.split("/").filter(Boolean);
    if (!owner || !repo) {
      return next(AppError.badRequest("Invalid GitHub repository URL"));
    }
    repoFull = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
  } catch {
    return next(AppError.badRequest("Invalid GitHub repository URL"));
  }

  const contributorLogin = String(login).toLowerCase().trim();
  const contributorKey = contributorLogin;

  // Check contributor quota (only for new contributor)
  const alreadyUsed =
    Array.isArray(userSubscription.currentUsage.usedContributors) &&
    userSubscription.currentUsage.usedContributors.includes(contributorKey);

  if (
    !alreadyUsed &&
    userSubscription.currentUsage.totalContributors >= contributorsLimit
  ) {
    return next(AppError.forbidden("Contributor limit reached for your plan"));
  }

  // Compute remaining commit-review capacity
  const consumedReviews = userSubscription.currentUsage.totalCommits ?? 0;
  const remainingReviews = Math.max(0, totalCommitLimit - consumedReviews);
  if (remainingReviews <= 0) {
    return next(
      AppError.forbidden("Commit review limit reached for your plan")
    );
  }

  // Per-contributor cap and overall remaining cap
  const requestedTop = Math.max(0, Number(topCommits) || 0);
  const perContributorCap = Math.max(
    0,
    Math.min(requestedTop, commitsPerContributorLimit)
  );
  const maxThisRequest = Math.max(
    0,
    Math.min(perContributorCap, remainingReviews)
  );
  if (maxThisRequest <= 0) {
    return next(AppError.forbidden("No remaining commit reviews available"));
  }

  // Build commits query with author and paging
  const commitsUrl = githubUrl.replace("https://github.com", "");
  let queryParams = `author=${encodeURIComponent(
    contributorLogin
  )}&per_page=${maxThisRequest}`;
  if (startDate) queryParams += `&since=${new Date(startDate).toISOString()}`;
  if (endDate) queryParams += `&until=${new Date(endDate).toISOString()}`;

  // Fetch commits
  const commitsList = await apiClient.get(
    `/repos${commitsUrl}/commits?${queryParams}`
  );
  let filteredCommits = commitsList.data;

  // Extra date filtering safety
  if (startDate || endDate) {
    filteredCommits = filteredCommits.filter((commit) => {
      const commitDate = new Date(commit?.commit?.author?.date);
      if (startDate && commitDate < new Date(startDate)) return false;
      if (endDate && commitDate > new Date(endDate)) return false;
      return true;
    });
  }

  // Enforce caps after retrieval as well
  filteredCommits = filteredCommits.slice(0, maxThisRequest);

  if (filteredCommits.length === 0) {
    return next(
      AppError.notFound("No data found in given criteria", {
        success: true,
        message: "No data found in given criteria",
        githubUrl,
        login,
        topCommits: requestedTop,
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      })
    );
  }

  // If new contributor, atomically consume a contributor slot
  if (!alreadyUsed) {
    const consumeContributor = await UserSubscriptions.updateOne(
      {
        _id: userSubscription._id,
        "currentUsage.usedContributors": { $nin: [contributorKey] }, // only if not already present
        "currentUsage.totalContributors": { $lt: contributorsLimit }, // under contributor limit
      },
      {
        $addToSet: { "currentUsage.usedContributors": contributorKey }, // unique add
        $inc: { "currentUsage.totalContributors": 1 }, // increment contributors
      }
    );

    if (consumeContributor.modifiedCount === 0) {
      // Re-check to resolve race
      const fresh = await UserSubscriptions.findById(
        userSubscription._id
      ).select("currentUsage.totalContributors currentUsage.usedContributors");
      const nowHas =
        fresh?.currentUsage?.usedContributors?.includes(contributorKey);
      const atLimit =
        (fresh?.currentUsage?.totalContributors ?? 0) >= contributorsLimit;
      if (!nowHas && atLimit) {
        return next(
          AppError.forbidden("Contributor limit reached for your plan")
        );
      }
      // else: contributor was added by a concurrent request; proceed
    }
  }

  // Get Socket.IO instance
  const io = getIO();

  // Emit start event to specific client
  io.to(socketId).emit("reviewStarted", {
    total: filteredCommits.length,
    message: "Starting code review process...",
  });

  // Review commits one by one, emit progress to the client
  const reviewResults = [];

  for (let i = 0; i < filteredCommits.length; i++) {
    const commit = filteredCommits[i];
    try {
      const codeResp = await apiClient.get(commit.url, {
        headers: { Accept: "application/vnd.github.v3.diff" },
      });

      const reviewJson = await reviewCodeAndGetSummary(codeResp.data);
      // const reviewJson = JSON.parse(reviewJson);

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
    } catch (error) {
      const errorResult = {
        sha: commit.sha,
        review: `Error: Failed to parse AI response`,
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

  // Atomically consume commit-review capacity for the exact number processed
  const reviewedCount = filteredCommits.length;
  if (reviewedCount > 0) {
    const consumeCommits = await UserSubscriptions.updateOne(
      {
        _id: userSubscription._id,
        "currentUsage.totalCommits": { $lte: totalCommitLimit - reviewedCount }, // still fits
      },
      {
        $inc: { "currentUsage.totalCommits": reviewedCount },
      }
    );

    if (consumeCommits.modifiedCount === 0) {
      // Rare race: capacity consumed by a concurrent request
      io.to(socketId).emit("reviewDone", {
        success: false,
        message:
          "Commit review limit was reached during processing. Some reviews may not be counted.",
        totalReviewed: 0,
        validScoresCount: 0,
      });
      return next(
        AppError.forbidden("Commit review limit reached during processing")
      );
    }
  }

  // Emit final "done" event to specific client
  io.to(socketId).emit("reviewDone", {
    success: true,
    reviewResults,
    averageScore,
    totalReviewed: reviewedCount,
    validScoresCount: validScores.length,
  });

  const data = {
    success: true,
    count: reviewedCount,
    dateRange: {
      startDate: startDate || null,
      endDate: endDate || null,
    },
    githubUrl,
    login: contributorLogin,
    topCommits: requestedTop,
    reviews: reviewResults,
    averageScore,
  };

  AppSuccess.ok(data).send(res);
});

export const getContributorsData = asyncHandler(async (req, res, next) => {
  const { githubUrl } = req.body;

  if (!githubUrl) {
    return AppError.badRequest("Github Url or User id is missing");
  }

  // Fetch user subscription and pricing plan
  const userSubscription = await UserSubscriptions.findOne({
    userId: req.user._id,
  }).populate("currentPlan");

  if (!userSubscription) {
    return next(AppError.notFound("User subscription not found"));
  }

  // Check if subscription is active
  const now = new Date();
  if (now > new Date(userSubscription.endDate)) {
    return next(AppError.forbidden("Subscription has expired"));
  }

  const plan = userSubscription.currentPlan;

  // Normalize to "owner/repo"
  let repoFull;
  try {
    const u = new URL(githubUrl);
    const [owner, repo] = u.pathname.split("/").filter(Boolean);
    if (!owner || !repo) {
      return next(AppError.badRequest("Invalid GitHub repository URL"));
    }
    repoFull = `${owner.toLocaleLowerCase()}/${repo.toLocaleLowerCase()}`;
  } catch {
    return next(AppError.badRequest("Invalid GitHub repository URL"));
  }

  // Allow same repo without counting, even if at limit
  const used =
    Array.isArray(userSubscription.currentUsage.usedRepositories) &&
    userSubscription.currentUsage.usedRepositories.includes(repoFull);

  // If it's new and already at limit, block
  if (
    !used &&
    userSubscription.currentUsage.totalRepositories >= plan.limits.repositories
  ) {
    return next(AppError.forbidden("Repository limit reached for your plan"));
  }
  // const contributorUrl = githubUrl.replace("https://github.com", "");
  const finalUrl = `/repos/${repoFull}/contributors`;

  const response = await apiClient.get(finalUrl);

  // If it's a new repo, atomically add once and increment count (guarded)
  if (!used) {
    const updateRes = await UserSubscriptions.updateOne(
      {
        _id: userSubscription._id,
        "currentUsage.usedRepositories": { $nin: [repoFull] }, // not already present
        "currentUsage.totalRepositories": { $lt: plan.limits.repositories }, // under limit
      },
      {
        $addToSet: { "currentUsage.usedRepositories": repoFull }, // add only if new
        $inc: { "currentUsage.totalRepositories": 1 }, // count only new
      }
    );

    // Handle races: if nothing modified, verify state to decide if limit was hit concurrently
    if (updateRes.modifiedCount === 0) {
      const fresh = await UserSubscriptions.findById(
        userSubscription._id
      ).select("currentUsage.totalRepositories currentUsage.usedRepositories");
      const nowHas = fresh?.currentUsage?.usedRepositories?.includes(repoFull);
      const atLimit =
        (fresh?.currentUsage?.totalRepositories ?? 0) >=
        plan.limits.repositories;

      if (!nowHas && atLimit) {
        return next(
          AppError.forbidden("Repository limit reached for your plan")
        );
      }
      // else: someone else added it concurrently; proceed without error
    }
  }

  AppSuccess.ok(response.data).send(res);
});

export const getContributorData = asyncHandler(async (req, res, next) => {
  const { login, githubUrl } = req.body;

  if (!login || !githubUrl) {
    return next(AppError.badRequest("Github Url or username is missing"));
  }

  // Normalize to "owner/repo"
  let repoFull, owner, repo;
  try {
    const u = new URL(githubUrl);
    [owner, repo] = u.pathname.split("/").filter(Boolean);
    if (!owner || !repo) {
      return next(AppError.badRequest("Invalid GitHub repository URL"));
    }
    repoFull = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
  } catch {
    return next(AppError.badRequest("Invalid GitHub repository URL"));
  }

  try {
    // 1. Get basic contributor info
    const contributorUrl = `/repos/${repoFull}/contributors`;
    const contributorsResponse = await apiClient.get(contributorUrl);
    const contributor = contributorsResponse.data.find(
      (c) => c.login.toLowerCase() === login.toLowerCase()
    );

    if (!contributor) {
      return next(
        AppError.notFound(`Contributor ${login} not found in this repository`)
      );
    }

    // 2. Get user profile data
    const userUrl = `/users/${login}`;
    const userResponse = await apiClient.get(userUrl);
    const userData = userResponse.data;

    // 3. Fetch ALL commits by this contributor with pagination
    let allCommits = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const commitsUrl = `/repos/${repoFull}/commits`;
      const commitsResponse = await apiClient.get(commitsUrl, {
        params: {
          author: login,
          per_page: 100,
          page: page,
        },
      });

      const commits = commitsResponse.data;
      allCommits = allCommits.concat(commits);

      // Check if there are more pages
      hasMore = commits.length === 100;
      page++;

      // Safety limit to prevent infinite loops
      if (page > 50) break; // Max 5000 commits
    }


    // 5. Get detailed commit data for top commits
    const commitDetails = await Promise.all(
      allCommits.slice(0, 10).map(async (commit) => {
        try {
          const detailUrl = `/repos/${repoFull}/commits/${commit.sha}`;
          const detail = await apiClient.get(detailUrl);
          return {
            sha: commit.sha,
            message: commit.commit.message,
            date: commit.commit.author.date,
            additions: detail.data.stats.additions,
            deletions: detail.data.stats.deletions,
            total: detail.data.stats.total,
            files: detail.data.files.map((f) => ({
              filename: f.filename,
              additions: f.additions,
              deletions: f.deletions,
              changes: f.changes,
            })),
          };
        } catch (err) {
          return {
            sha: commit.sha,
            message: commit.commit.message,
            date: commit.commit.author.date,
            error: "Could not fetch detailed stats",
          };
        }
      })
    );

    // 6. Calculate statistics
    const totalCommits = allCommits.length;
    const firstCommitDate =
      allCommits.length > 0
        ? allCommits[allCommits.length - 1].commit.author.date
        : null;
    const lastCommitDate =
      allCommits.length > 0 ? allCommits[0].commit.author.date : null;

    // Calculate total lines changed (from top 10 commits)
    const totalStats = commitDetails.reduce(
      (acc, commit) => {
        if (!commit.error) {
          acc.additions += commit.additions || 0;
          acc.deletions += commit.deletions || 0;
          acc.total += commit.total || 0;
        }
        return acc;
      },
      { additions: 0, deletions: 0, total: 0 }
    );

    // 7. Find top commit (most changes)
    const topCommit = commitDetails.reduce((max, commit) => {
      if (commit.error) return max;
      return !max || commit.total > (max.total || 0) ? commit : max;
    }, null);

    // 8. Get contribution activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCommits = allCommits.filter(
      (c) => new Date(c.commit.author.date) > thirtyDaysAgo
    );


    // 10. Compile response
    const contributorData = {
      profile: {
        login: userData.login,
        name: userData.name,
        avatar_url: userData.avatar_url,
        bio: userData.bio,
        company: userData.company,
        location: userData.location,
        email: userData.email,
        blog: userData.blog,
        twitter_username: userData.twitter_username,
        public_repos: userData.public_repos,
        followers: userData.followers,
        following: userData.following,
        created_at: userData.created_at,
      },
      repository: {
        name: repo,
        owner: owner,
        full_name: repoFull,
      },
      contributions: {
        total_commits: totalCommits,
        total_contributions: contributor.contributions,
        first_commit_date: firstCommitDate,
        last_commit_date: lastCommitDate,
        recent_commits_30_days: recentCommits.length,
      },
      statistics: {
        lines_added: totalStats.additions,
        lines_deleted: totalStats.deletions,
        total_changes: totalStats.total,
      },
      topCommit: topCommit
        ? {
            sha: topCommit.sha,
            message: topCommit.message,
            date: topCommit.date,
            additions: topCommit.additions,
            deletions: topCommit.deletions,
            total_changes: topCommit.total,
            files_changed: topCommit.files.length,
          }
        : null,
      recentCommits: allCommits.slice(0, 5).map((c) => ({
        sha: c.sha,
        message: c.commit.message,
        date: c.commit.author.date,
        url: c.html_url,
      })),
    };

    res.status(200).json({
      success: true,
      data: contributorData,
    });
  } catch (error) {
    console.error("Error fetching contributor data:", error);

    if (error.response?.status === 404) {
      return next(
        AppError.notFound("Repository or contributor not found on GitHub")
      );
    }

    if (error.response?.status === 403) {
      return next(
        AppError.forbidden(
          "GitHub API rate limit exceeded. Please try again later."
        )
      );
    }

    return next(
      AppError.internal("Failed to fetch contributor data from GitHub")
    );
  }
});



// Helper function to determine contribution level (0-4, like GitHub)
function getContributionLevel(count) {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}