import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export class URLClassifierAgent {
  private systemPrompt = `You are a URL classifier. Respond with ONLY a JSON array of blog post URLs.
No explanation. No formatting. Just the array.
Maximum 50 URLs.`

  async classifyBlogUrls(urls: string[], authorName: string): Promise<string[]> {
    if (urls.length === 0) return []
    
    const userPrompt = `Given these URLs from ${authorName}'s website, identify which are blog posts/articles/essays.
Look for:
- URLs with dates (2024/08/, 2025-01-15)
- Article slugs (how-to-xyz, my-thoughts-on)
- Essay pages (for sites like paulgraham.com where .html files are essays)
- Blog post patterns (/blog/, /posts/, /articles/)

Exclude:
- Sitemap files (.xml)
- Navigation pages (about, contact, privacy, terms)
- Category/tag/archive pages
- Media files (images, PDFs)
- Homepage/index pages

URLs to classify:
${urls.join('\n')}

Return JSON array of up to 50 blog post URLs, ordered by recency if dates are visible.`

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0,        // Deterministic = faster
        max_tokens: 500,       // Limit output size
        response_format: { type: "json_object" }
      })

      const content = response.choices[0].message.content
      if (!content) return []

      try {
        const result = JSON.parse(content)
        // Handle different response formats
        if (Array.isArray(result)) {
          return result.slice(0, 50)
        }
        if (result.urls && Array.isArray(result.urls)) {
          return result.urls.slice(0, 50)
        }
        if (result.blog_posts && Array.isArray(result.blog_posts)) {
          return result.blog_posts.slice(0, 50)
        }
        return []
      } catch (parseError) {
        console.error("Failed to parse classifier response:", parseError)
        return []
      }
    } catch (error) {
      console.error("URL classification error:", error)
      return []
    }
  }

  // Process URLs in chunks for better performance
  async classifyInChunks(urls: string[], authorName: string, chunkSize = 100): Promise<string[]> {
    const chunks: string[][] = []
    for (let i = 0; i < urls.length; i += chunkSize) {
      chunks.push(urls.slice(i, i + chunkSize))
    }

    const results = await Promise.all(
      chunks.map(chunk => this.classifyBlogUrls(chunk, authorName))
    )

    return results.flat().slice(0, 50)
  }
}