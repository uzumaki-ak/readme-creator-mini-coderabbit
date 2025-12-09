// Euron AI API client
export interface EuronMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface EuronCompletionOptions {
  messages: EuronMessage[]
  model?: string
  max_tokens?: number
  temperature?: number
  stream?: boolean
}

const EURON_API_URL = "https://api.euron.one/api/v1/euri/chat/completions"

export async function createEuronCompletion(options: EuronCompletionOptions) {
  const apiKey = process.env.EURON_API_KEY

  if (!apiKey) {
    throw new Error("EURON_API_KEY is not configured")
  }

  // Validate key format
  if (!apiKey.startsWith('sk-')) {
    throw new Error("Invalid Euron API key format. Key should start with 'sk-'")
  }

  const response = await fetch(EURON_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages: options.messages,
      model: options.model || process.env.EURON_MODEL || "gpt-4.1-nano",
      max_tokens: options.max_tokens || 4000,
      temperature: options.temperature || 0.7,
      stream: options.stream ?? false,
    }),
  })

  if (!response.ok) {
    let errorMessage = `Euron API error: ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage += ` - ${JSON.stringify(errorData)}`
    } catch {
      const text = await response.text()
      errorMessage += ` - ${text}`
    }
    throw new Error(errorMessage)
  }

  return response
}

export async function createEuronStreamingCompletion(options: Omit<EuronCompletionOptions, "stream">) {
  const apiKey = process.env.EURON_API_KEY

  if (!apiKey) {
    throw new Error("EURON_API_KEY is not configured")
  }

  // Validate key format
  // if (!apiKey.startsWith('sk-')) {
  //   throw new Error("Invalid Euron API key format. Key should start with 'sk-'")
  // }

  const response = await fetch(EURON_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages: options.messages,
      model: options.model || process.env.EURON_MODEL || "gpt-4.1-nano",
      max_tokens: options.max_tokens || 4000,
      temperature: options.temperature || 0.7,
      stream: true,
    }),
  })

  if (!response.ok) {
    let errorMessage = `Euron API error: ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage += ` - ${JSON.stringify(errorData)}`
    } catch {
      const text = await response.text()
      errorMessage += ` - ${text}`
    }
    throw new Error(errorMessage)
  }

  return response
}