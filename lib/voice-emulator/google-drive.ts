export async function createGoogleDoc(
  creatorName: string,
  content: any[],
  targetFolderId: string = 'voice-emulator-8.14.25'
): Promise<string> {
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
    
    // Convert content to markdown
    const markdown = formatContentAsMarkdown(creatorName, content)
    
    // Create a temporary markdown file
    const fileName = `${creatorName} Voice Emulation - ${dateStr}`
    
    // Upload markdown as a Google Doc
    const file = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: 'application/vnd.google-apps.document',
        parents: [subfolder.id]
      },
      media: {
        mimeType: 'text/markdown',
        body: markdown
      }
    })
    
    // Format the document with proper styling
    if (file.data.id) {
      await formatDocument(docs, file.data.id, creatorName)
    }
    
    return `https://docs.google.com/document/d/${file.data.id}/edit`
  } catch (error) {
    console.error('Error creating Google Doc:', error)
    throw error
  }
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

function formatContentAsMarkdown(creatorName: string, content: any[]): string {
  let markdown = `# ${creatorName} Voice Emulation Content\n\n`
  markdown += `Generated: ${new Date().toLocaleString()}\n\n`
  markdown += `---\n\n`
  
  // Group content by type
  const grouped = content.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = []
    acc[item.type].push(item)
    return acc
  }, {} as Record<string, any[]>)
  
  // Format each section
  if (grouped.newsletter?.length) {
    markdown += `## 📧 Newsletter Content\n\n`
    grouped.newsletter.forEach((item: any, i: number) => {
      markdown += `### Newsletter ${i + 1}\n`
      if (item.metadata?.title) markdown += `**${item.metadata.title}**\n\n`
      if (item.metadata?.url) markdown += `Source: ${item.metadata.url}\n\n`
      markdown += `${item.content}\n\n---\n\n`
    })
  }
  
  if (grouped.tweet?.length) {
    markdown += `## 🐦 Twitter/X Posts (Top ${grouped.tweet.length})\n\n`
    grouped.tweet
      .sort((a: any, b: any) => {
        const engA = (a.metadata?.engagement?.likes || 0) + (a.metadata?.engagement?.retweets || 0) * 2
        const engB = (b.metadata?.engagement?.likes || 0) + (b.metadata?.engagement?.retweets || 0) * 2
        return engB - engA
      })
      .forEach((tweet: any, i: number) => {
        markdown += `### Tweet ${i + 1}\n`
        markdown += `${tweet.content}\n\n`
        if (tweet.metadata?.engagement) {
          const eng = tweet.metadata.engagement
          markdown += `📊 Engagement: ${eng.likes || 0} likes, ${eng.retweets || 0} retweets, ${eng.replies || 0} replies\n`
        }
        if (tweet.metadata?.createdAt) {
          markdown += `📅 Posted: ${new Date(tweet.metadata.createdAt).toLocaleDateString()}\n`
        }
        markdown += `\n---\n\n`
      })
  }
  
  if (grouped.linkedin?.length) {
    markdown += `## 💼 LinkedIn Posts (Top ${grouped.linkedin.length})\n\n`
    grouped.linkedin
      .sort((a: any, b: any) => {
        const engA = (a.metadata?.engagement?.likes || 0) + (a.metadata?.engagement?.shares || 0) * 2
        const engB = (b.metadata?.engagement?.likes || 0) + (b.metadata?.engagement?.shares || 0) * 2
        return engB - engA
      })
      .forEach((post: any, i: number) => {
        markdown += `### LinkedIn Post ${i + 1}\n`
        markdown += `${post.content}\n\n`
        if (post.metadata?.engagement) {
          const eng = post.metadata.engagement
          markdown += `📊 Engagement: ${eng.likes || 0} likes, ${eng.comments || 0} comments, ${eng.shares || 0} shares\n`
        }
        if (post.metadata?.postedAt) {
          markdown += `📅 Posted: ${new Date(post.metadata.postedAt).toLocaleDateString()}\n`
        }
        markdown += `\n---\n\n`
      })
  }
  
  if (grouped.blog?.length) {
    markdown += `## 📝 Blog Articles\n\n`
    grouped.blog.forEach((article: any, i: number) => {
      markdown += `### Article ${i + 1}: ${article.metadata?.title || 'Untitled'}\n\n`
      if (article.metadata?.url) markdown += `Source: ${article.metadata.url}\n\n`
      markdown += `${article.content}\n\n---\n\n`
    })
  }
  
  // Add summary
  markdown += `## 📊 Content Summary\n\n`
  markdown += `- Total pieces collected: ${content.length}\n`
  Object.entries(grouped).forEach(([type, items]) => {
    markdown += `- ${type.charAt(0).toUpperCase() + type.slice(1)}: ${(items as any[]).length} items\n`
  })
  
  return markdown
}

async function formatDocument(docs: any, documentId: string, creatorName: string) {
  try {
    // Get the document to find text positions
    const doc = await docs.documents.get({ documentId })
    
    // Create formatting requests
    const requests = [
      // Format title
      {
        updateTextStyle: {
          range: {
            startIndex: 1,
            endIndex: creatorName.length + 25 // "# {name} Voice Emulation Content"
          },
          textStyle: {
            fontSize: { magnitude: 24, unit: 'PT' },
            bold: true
          },
          fields: 'fontSize,bold'
        }
      },
      // Format section headers
      {
        updateParagraphStyle: {
          range: {
            startIndex: 1,
            endIndex: doc.data.body.content[doc.data.body.content.length - 1].endIndex
          },
          paragraphStyle: {
            spaceAbove: { magnitude: 12, unit: 'PT' },
            spaceBelow: { magnitude: 6, unit: 'PT' }
          },
          fields: 'spaceAbove,spaceBelow'
        }
      }
    ]
    
    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests }
    })
  } catch (error) {
    console.error('Error formatting document:', error)
    // Non-critical error, continue
  }
}