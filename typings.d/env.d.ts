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

// OpenCC-JS type definitions
declare module 'opencc-js' {
  interface ConverterOptions {
    from: string
    to: string
  }

  function Converter(options: ConverterOptions): (text: string) => string
  export { Converter }
}
