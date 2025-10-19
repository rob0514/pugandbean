export const BUILD_TAG =
  `${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0,7) ?? "local"} • ${process.env.VERCEL_ENV ?? "dev"}`;
