// The bundler embeds markdown files as text (see tools/mcp/build.mjs).
declare module '*.md' {
  const content: string;
  export default content;
}
