import { streamText } from 'ai'
const result = streamText({
  model: 'google/gemini-flash-1.5',
  prompt: 'Why is the sky blue?'
})
for await (const chunk of result.textStream) {
  process.stdout.write(chunk)
}
