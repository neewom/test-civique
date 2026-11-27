// Packs of questions cut at build time by vite-question-packs.ts (one virtual module per title)
declare module 'virtual:question-pack/*' {
  const questions: import('@/lib/exam').ListedQuestion[]
  export default questions
}
