import { GitHub } from "arctic";

// Oauth client for the github
export const github = new GitHub(
  process.env.GITHUB_CLIENT_ID,
  process.env.GITHUB_CLIENT_SECRETS,
  process.env.NODE_ENV === "development"
    ? `${process.env.LOCAL_FRONTEND_URL}/login/github/callback`
    : process.env.FRONTEND_URL
);
