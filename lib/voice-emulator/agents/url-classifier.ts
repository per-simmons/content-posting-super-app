import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export class URLClassifierAgent {
  private systemPrompt = `You are a URL classifier. Respond with ONLY a JSON object containing an array of blog post URLs.
Use this exact format: {"urls": ["url1", "url2", ...]}
No explanation. No additional fields. Maximum 50 URLs.`

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

Return JSON object with format: {"urls": ["url1", "url2", ...]} containing up to 50 blog post URLs, ordered by recency if dates are visible.`

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0,        // Deterministic = faster
        max_tokens: 2000,      // Increased for full URL list
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
        console.error("Raw response content:", content)
        console.error("Content length:", content?.length)
        // Return empty array on parse failure instead of crashing
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

  async classifyNewsletterUrls(urls: string[], authorName: string): Promise<string[]> {
    if (urls.length === 0) return []
    
    const userPrompt = `Given these URLs from ${authorName}'s newsletter/substack, identify which are individual newsletter issues.
Look for:
- URLs with dates (2024/08/, 2024-08-15, august-2024)
- Issue numbers (/issue-42, /edition-15)
- Newsletter archive pages with individual posts
- Substack post URLs (/p/)
- Email campaign URLs

Exclude:
- About pages, contact, privacy, terms
- Subscribe/unsubscribe pages
- Author bio pages
- Category/tag pages
- Homepage/index

URLs to classify:
${urls.join('\n')}

Return JSON object with format: {"urls": ["url1", "url2", ...]} containing up to 30 newsletter issue URLs, ordered by recency if dates are visible.`

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          { 
            role: "system", 
            content: "You are a URL classifier. Respond with ONLY a JSON object containing an array of newsletter issue URLs. Use this exact format: {\"urls\": [\"url1\", \"url2\", ...]}. No explanation. No additional fields. Maximum 30 URLs."
          },
          { role: "user", content: userPrompt }
        ],
        temperature: 0,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })

      const content = response.choices[0].message.content
      if (!content) return []

      try {
        const result = JSON.parse(content)
        // Handle different response formats
        if (Array.isArray(result)) {
          return result.slice(0, 30)
        }
        if (result.urls && Array.isArray(result.urls)) {
          return result.urls.slice(0, 30)
        }
        if (result.newsletters && Array.isArray(result.newsletters)) {
          return result.newsletters.slice(0, 30)
        }
        return []
      } catch (parseError) {
        console.error("Failed to parse newsletter classifier response:", parseError)
        return []
      }
    } catch (error) {
      console.error("Newsletter URL classification error:", error)
      return []
    }
  }
}