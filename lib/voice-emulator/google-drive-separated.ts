export async function createSeparateGoogleDocs(
  creatorName: string,
  content: any[],
  targetFolderId: string = 'voice-emulator-8.14.25'
): Promise<{
  blog: string | null,
  twitter: string | null,
  linkedin: string | null,
  newsletter: string | null,
  summary: string
}> {
  try {
    // Dynamic import for server-side only
    const { google } = await import('googleapis')
    const googleAuthLibrary = await import('google-auth-library')
    console.log('google-auth-library import:', Object.keys(googleAuthLibrary))
    const { JWT } = googleAuthLibrary
    console.log('JWT extracted:', typeof JWT, JWT)
    
    if (!JWT) {
      throw new Error('JWT is undefined - google-auth-library import failed')
    }
    
    const auth = getGoogleAuth(JWT)
    const drive = google.drive({ version: 'v3', auth })
    const docs = google.docs({ version: 'v1', auth })
    
    // Format the date
    const today = new Date()
    const dateStr = `${today.getMonth() + 1}.${today.getDate()}.${today.getFullYear().toString().slice(-2)}`
    
    // Create subfolder name
    const subfolderName = `${creatorName.toLowerCase().replace(/\s+/g, '-')}-voiceemulator-${dateStr}`
    
    // Find or create the main folder
    const mainFolder = await findOrCreateFolder(drive, targetFolderId)
    
    // Create subfolder
    const subfolder = await createFolder(drive, subfolderName, mainFolder.id)
    
    // Group content by type
    const grouped = content.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = []
      acc[item.type].push(item)
      return acc
    }, {} as Record<string, any[]>)
    
    // Create separate documents in parallel
    const [blogDoc, twitterDoc, linkedinDoc, newsletterDoc] = await Promise.all([
      grouped.blog?.length ? createDocForType(drive, docs, subfolder.id, creatorName, 'blog', grouped.blog, dateStr) : Promise.resolve(null),
      grouped.tweet?.length ? createDocForType(drive, docs, subfolder.id, creatorName, 'twitter', grouped.tweet, dateStr) : Promise.resolve(null),
      grouped.linkedin?.length ? createDocForType(drive, docs, subfolder.id, creatorName, 'linkedin', grouped.linkedin, dateStr) : Promise.resolve(null),
      grouped.newsletter?.length ? createDocForType(drive, docs, subfolder.id, creatorName, 'newsletter', grouped.newsletter, dateStr) : Promise.resolve(null),
    ])
    
    // Create a summary document with links to all other docs
    const summaryDoc = await createSummaryDoc(
      drive, 
      docs, 
      subfolder.id, 
      creatorName, 
      dateStr,
      {
        blog: blogDoc,
        twitter: twitterDoc,
        linkedin: linkedinDoc,
        newsletter: newsletterDoc,
        totalContent: content.length,
        breakdown: Object.entries(grouped).map(([type, items]) => ({
          type,
          count: (items as any[]).length
        }))
      }
    )
    
    return {
      blog: blogDoc,
      twitter: twitterDoc,
      linkedin: linkedinDoc,
      newsletter: newsletterDoc,
      summary: summaryDoc
    }
  } catch (error) {
    console.error('Error creating separate Google Docs:', error)
    throw error
  }
}

async function createDocForType(
  drive: any,
  docs: any,
  folderId: string,
  creatorName: string,
  type: string,
  content: any[],
  dateStr: string
): Promise<string> {
  // Create filename based on type
  const fileName = `${creatorName.toLowerCase().replace(/\s+/g, '-')}-voiceemulator-${type}-${dateStr}`
  
  // Format content for this type
  let markdown = `# ${creatorName} - ${type.charAt(0).toUpperCase() + type.slice(1)} Content\n\n`
  markdown += `Generated: ${new Date().toLocaleString()}\n\n`
  markdown += `Total ${type} items: ${content.length}\n\n`
  markdown += `---\n\n`
  
  // Format based on content type
  if (type === 'blog') {
    content.forEach((article: any, i: number) => {
      markdown += `## Article ${i + 1}: ${article.metadata?.title || 'Untitled'}\n\n`
      if (article.metadata?.url) markdown += `Source: ${article.metadata.url}\n\n`
      if (article.metadata?.isPopular) markdown += `⭐ Popular Post - ${article.metadata.influenceReason}\n\n`
      markdown += `${article.content}\n\n---\n\n`
    })
  } else if (type === 'twitter' || type === 'tweet') {
    content
      .sort((a: any, b: any) => (b.metadata?.engagement || 0) - (a.metadata?.engagement || 0))
      .forEach((tweet: any, i: number) => {
        markdown += `## Tweet ${i + 1}\n\n`
        markdown += `${tweet.content}\n\n`
        markdown += `📊 Engagement Score: ${tweet.metadata?.engagement || 0}\n`
        if (tweet.metadata?.createdAt) {
          markdown += `📅 Posted: ${new Date(tweet.metadata.createdAt).toLocaleDateString()}\n`
        }
        markdown += `\n---\n\n`
      })
  } else if (type === 'linkedin') {
    content
      .sort((a: any, b: any) => (b.metadata?.engagement || 0) - (a.metadata?.engagement || 0))
      .forEach((post: any, i: number) => {
        markdown += `## LinkedIn Post ${i + 1}\n\n`
        markdown += `${post.content}\n\n`
        markdown += `📊 Engagement Score: ${post.metadata?.engagement || 0}\n`
        if (post.metadata?.postedAt) {
          markdown += `📅 Posted: ${new Date(post.metadata.postedAt).toLocaleDateString()}\n`
        }
        markdown += `\n---\n\n`
      })
  } else if (type === 'newsletter') {
    content.forEach((item: any, i: number) => {
      markdown += `## Newsletter ${i + 1}: ${item.metadata?.title || 'Issue'}\n\n`
      if (item.metadata?.url) markdown += `Source: ${item.metadata.url}\n\n`
      markdown += `${item.content}\n\n---\n\n`
    })
  }
  
  // Upload markdown as a Google Doc
  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: 'application/vnd.google-apps.document',
      parents: [folderId]
    },
    media: {
      mimeType: 'text/markdown',
      body: markdown
    }
  })
  
  return `https://docs.google.com/document/d/${file.data.id}/edit`
}

async function createSummaryDoc(
  drive: any,
  docs: any,
  folderId: string,
  creatorName: string,
  dateStr: string,
  stats: any
): Promise<string> {
  const fileName = `${creatorName.toLowerCase().replace(/\s+/g, '-')}-voiceemulator-summary-${dateStr}`
  
  let markdown = `# ${creatorName} Voice Emulator - Summary\n\n`
  markdown += `Generated: ${new Date().toLocaleString()}\n\n`
  markdown += `---\n\n`
  
  markdown += `## 📊 Content Overview\n\n`
  markdown += `Total pieces collected: **${stats.totalContent}**\n\n`
  
  markdown += `### Breakdown by Type:\n`
  stats.breakdown.forEach((item: any) => {
    markdown += `- **${item.type.charAt(0).toUpperCase() + item.type.slice(1)}**: ${item.count} items\n`
  })
  markdown += `\n`
  
  markdown += `## 📁 Individual Documents\n\n`
  if (stats.blog) markdown += `- [📝 Blog Content](${stats.blog})\n`
  if (stats.twitter) markdown += `- [🐦 Twitter Content](${stats.twitter})\n`
  if (stats.linkedin) markdown += `- [💼 LinkedIn Content](${stats.linkedin})\n`
  if (stats.newsletter) markdown += `- [📧 Newsletter Content](${stats.newsletter})\n`
  
  markdown += `\n---\n\n`
  markdown += `## 🎯 Next Steps\n\n`
  markdown += `1. Review the extracted content in each document\n`
  markdown += `2. Patterns and voice characteristics are being analyzed\n`
  markdown += `3. System prompt generation in progress\n`
  markdown += `4. Voice emulation will be available via Command-E\n`
  
  // Upload markdown as a Google Doc
  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: 'application/vnd.google-apps.document',
      parents: [folderId]
    },
    media: {
      mimeType: 'text/markdown',
      body: markdown
    }
  })
  
  return `https://docs.google.com/document/d/${file.data.id}/edit`
}

function getGoogleAuth(JWT: any) {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}')
  
  // Fix Vercel environment variable newline handling
  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n')
  }
  
  return JWT.fromJSON({
    ...credentials,
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/documents'
    ]
  })
}

async function findOrCreateFolder(drive: any, folderName: string) {
  // Search for existing folder
  const response = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)'
  })
  
  if (response.data.files?.length > 0) {
    return response.data.files[0]
  }
  
  // Create new folder if not found
  return createFolder(drive, folderName)
}

async function createFolder(drive: any, folderName: string, parentId?: string) {
  const fileMetadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  }
  
  if (parentId) {
    fileMetadata.parents = [parentId]
  }
  
  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id, name'
  })
  
  return folder.data
}