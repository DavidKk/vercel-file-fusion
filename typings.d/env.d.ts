declare namespace NodeJS {
  interface ProcessEnv {
    // Build time
    NEXT_PUBLIC_BUILD_TIME: string
    // Vercel API Token
    VERCEL_ACCESS_TOKEN?: string
    // Exclude project links in the footer
    VERCEL_PROJECT_EXCLUDES?: string
  }
}
