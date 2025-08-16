# Voice Emulator Steps Refactor - 8/16/25

## Overview
Refactoring the Voice Emulator from a monolithic trigger.dev background pipeline to a step-by-step UI with human-in-the-loop control, following the SEO Agent pattern.

## Current Architecture Problems
1. **Black Box Processing**: User can't see intermediate results or make corrections
2. **All-or-Nothing**: If one step fails, entire pipeline fails
3. **No User Control**: Can't edit URLs, skip steps, or customize extraction
4. **Complex Debugging**: Hard to troubleshoot specific step failures
5. **Long Wait Times**: 20+ minute waits with no visibility

## New Step-by-Step Architecture

### UI Pattern (Based on SEO Agent)
```typescript
const VOICE_EMULATOR_STEPS = [
  "Creator Setup",           // Step 1: Name + content type checkboxes
  "Source Discovery",        // Step 2: Perplexity auto-discovery with edit capability  
  "Newsletter Extraction",   // Step 3: Firecrawl Map + GPT Classification + Jina extraction
  "Twitter Extraction",      // Step 4: Apify actor (20+ min async)
  "LinkedIn Extraction",     // Step 5: Apify actor (30+ min async)
  "Blog Extraction",         // Step 6: 4-step optimized (Firecrawl + GPT + Jina + Perplexity)
  "Consolidation",           // Step 7: Merge all content + create Google Docs
  "Vectorization",           // Step 8: Contextual retrieval embeddings
  "Retrieval",               // Step 9: Semantic search system
  "Analysis",                // Step 10: 3-phase AI (Pattern + Traits + Prompt)
  "Final Results"            // Step 11: System prompt + Command-E integration
] as const

const [stepIndex, setStepIndex] = useState(0)
```

### Step-by-Step Breakdown

#### **Step 1: Creator Setup**
- **User Input**: Simple form with creator name + content type checkboxes
- **Form Fields**:
  - Creator name (text input)
  - ☐ Newsletter content
  - ☐ Twitter posts  
  - ☐ LinkedIn posts
  - ☐ Blog articles
- **User Controls**: 
  - Check/uncheck content types to analyze
  - Name validation (required)
- **Output**: Creator name + selected content types
- **Next Button**: Enabled when name provided

#### **Step 2: Source Discovery** 
- **Automatic Processing**: Perplexity sonar-pro discovers all URLs
- **Perplexity Query**: Uses exact format from existing system
- **User Controls**:
  - Review auto-discovered URLs in editable form fields
  - Edit newsletter URL, Twitter handle, LinkedIn URL, blog URL
  - Manually correct any wrong URLs
- **Output**: Validated source URLs
- **Processing Time**: ~3-5 seconds with Perplexity

#### **Step 3: Newsletter Extraction** (if selected)
- **Automatic Processing**: 3-step optimized process
  1. **Firecrawl /map discovers newsletter URLs** (1-2s)
     - Discovers up to 100 URLs from newsletter/Substack site
     - Gets comprehensive archive structure
  2. **GPT-4.1-mini classifies actual newsletter issues** (0.5s)
     - Filters actual newsletter issues from all URLs
     - Looks for date patterns, issue numbers, Substack post URLs
     - Excludes about pages, subscribe pages, category pages
     - Returns up to 30 newsletter issue URLs
  3. **Jina.ai extracts content in parallel batches** (2-3s)
     - Parallel extraction in batches of 10
     - Faster than sequential extraction
     - Preserves title and publish date metadata
- **User Controls**:
  - Review discovered newsletter URLs (up to 100 total)
  - Edit newsletter URL list if needed
  - Preview extracted content with titles
  - Skip if no newsletter
  - See chronological ordering by date
- **Output**: Up to 30 newsletter issues with full content and metadata
- **Processing Time**: ~5-6 seconds total (vs 45s old method)
- **Deduplication**: By URL to avoid duplicate issues

#### **Step 4: Twitter Extraction** (if selected - ASYNC)
- **Automatic Processing**: 
  - Apify kaitoeasyapi~twitter-x-data-tweet-scraper actor
  - Extracts top 50 tweets by engagement (likes + retweets*2 + replies)
  - 20+ minute processing time
- **Async Implementation**:
  - Start job, get job ID immediately
  - Show "Processing..." with polling status
  - User can navigate away and return
  - Auto-refresh when complete
- **User Controls**:
  - Review extracted tweets when complete
  - See engagement metrics
  - Skip if no Twitter handle
- **Output**: Top 50 engaged tweets
- **Processing Time**: 20+ minutes (async background)

#### **Step 5: LinkedIn Extraction** (if selected - ASYNC)
- **Automatic Processing**: 
  - **Apify Actor**: `apimaestro/linkedin-profile-posts`
  - Extracts up to 50 posts, returns top 20 by engagement
  - **Configuration**: 
    - Profile URL and username extraction
    - Includes regular posts and reshares with commentary (>50 chars)
    - Excludes simple reshares without commentary
  - **Engagement Scoring**: `reactions + (comments × 2) + (reposts × 3)`
    - Reactions: All types (like, support, love, insight, celebrate)
    - Comments weighted 2x for deeper engagement
    - Reposts weighted 3x for reach amplification
  - 30+ minute processing time
- **Async Implementation**:
  - Start job, get job ID immediately
  - Poll status with user-friendly progress display
  - Background processing with job ID tracking
  - Auto-refresh when complete
- **User Controls**:
  - Review extracted posts when complete
  - See detailed engagement breakdown (reactions, comments, reposts)
  - View engagement scores and post types
  - Skip if no LinkedIn profile
- **Output**: Top 20 engaged LinkedIn posts with full metadata
- **Processing Time**: 30+ minutes (async background)
- **Deduplication**: By post ID to avoid duplicates

#### **Step 6: Blog Extraction** (if selected)
- **Automatic Processing**: 4-step optimized process
  1. **Firecrawl /map discovers all URLs** (1-2s)
     - Discovers up to 100 URLs from blog/website
     - Gets comprehensive site structure
  2. **GPT-4.1-mini classifies blog posts** (0.5s)
     - Filters actual blog posts from all URLs
     - Looks for date patterns, article slugs, essay pages
     - Excludes navigation, media, sitemap files
     - Returns up to 50 blog post URLs
  3. **Jina.ai extracts content in parallel** (2-3s)
     - Parallel extraction in batches of 10
     - 2x faster than Firecrawl /scrape
     - Optimized for content extraction
  4. **Perplexity finds 5 most popular posts** (2-3s)
     - Query: "Find the 5 most popular, influential, or important blog posts from [blogUrl] by [authorName]"
     - Returns title, URL, and influence reason for each
     - Extracts content with Jina.ai
     - Marks as `isPopular: true` with influence reasons
     - Deduplicates against existing URLs
- **User Controls**:
  - Review discovered blog URLs (up to 100 total)
  - Preview extracted content from filtered posts
  - See which posts marked as "popular" with influence reasons
  - Edit URL list if needed
  - View performance metrics (word count, headings)
- **Output**: Up to 55 blog articles (50 regular + 5 popular)
- **Processing Time**: ~8 seconds total (19x faster than old method)
- **Deduplication**: By URL to avoid duplicate content

#### **Step 7: Consolidation**
- **Automatic Processing**: 
  - Merge all extracted content with deduplication
  - Create 5 organized Google Docs (blog, twitter, linkedin, newsletter, summary)
  - Normalize metadata across platforms
- **User Controls**:
  - Review content counts by platform
  - See Google Doc links as they're created
  - Preview summary document
- **Output**: Organized Google Drive folder with separate docs
- **Processing Time**: 1-2 seconds

#### **Step 8: Vectorization** 
- **Automatic Processing**: Advanced contextual retrieval implementation
  - **Contextual Expansion**: Each chunk expanded with LLM-generated context before embedding
  - **Proper Boundaries**: Chunks never cross content boundaries (blog posts stay separate)
  - **Embedding Model**: `text-embedding-3-small` (OpenAI)
  - **Context Model**: `gpt-4.1-mini` for contextual expansion
  - **Configuration**: 600-word chunks, 100-word overlap, batch size 10
  - **Three-Step Process**:
    1. Create contextual chunks with metadata prefixes
    2. Expand with LLM context for self-contained chunks  
    3. Generate embeddings and BM25 scores for hybrid search
  - **67% improvement in retrieval accuracy** (Anthropic benchmark)
- **User Controls**:
  - See progress of chunking and embedding process
  - Review chunk count and metadata preservation
  - Preview contextual expansions
  - Monitor embedding quality metrics
- **Output**: Vectorized content with contextual retrieval ready for semantic search
- **Processing Time**: 30-60 seconds depending on content volume
- **All Content Vectorized**: Every piece from all sources automatically processed

#### **Step 9: Retrieval System**
- **Automatic Processing**: 
  - Set up semantic search infrastructure
  - Test retrieval with sample queries
  - Validate embedding quality
- **User Controls**:
  - Test search with sample queries
  - See retrieval results and relevance scores
- **Output**: Working semantic search system
- **Processing Time**: 5-10 seconds

#### **Step 10: Analysis** 
- **Automatic Processing**: 3-phase AI analysis
  1. **Pattern Finder (GPT-4.1-mini)** - identifies recurring phrases and structures
     - Analyzes all collected content for reproducible characteristics
     - Extracts specific recurring phrases with direct quotes
     - Identifies sentence structure patterns with examples
     - Maps vocabulary preferences and complexity levels
     - Finds stylistic markers and unique quirks
     - Returns structured JSON with concrete examples
  2. **Voice Traits Generator (GPT-4.1-mini)** - converts patterns to actionable rules
     - Transforms patterns into behavioral response triggers
     - Defines emotional triggers with specific indicators
     - Creates platform-specific adaptation rules (Twitter vs Blog)
     - Specifies frequency (always/often/sometimes/rarely)
     - Maps triggers to specific response patterns
  3. **Prompt Synthesizer (GPT-5)** - creates final system prompt
     - Synthesizes comprehensive voice emulation instructions
     - Includes platform-specific guidelines
     - Provides Do's and Don'ts with concrete examples
     - Creates production-ready system prompt
     - Falls back to GPT-4-turbo-preview if GPT-5 unavailable
- **User Controls**:
  - Review identified patterns with direct text examples
  - See voice traits and behavioral trigger rules
  - Preview final system prompt with platform guidelines
  - Edit/override any analysis findings
  - Test voice emulation with sample prompts
- **Output**: Production-ready voice emulation system prompt with behavioral rules
- **Processing Time**: 30-60 seconds across three AI phases

#### **Step 11: Final Results**
- **Automatic Processing**: 
  - Finalize voice profile in database
  - Prepare for Command-E integration
  - Generate usage instructions
- **User Controls**:
  - Test voice emulation with sample text
  - See complete analysis summary
  - Export system prompt
  - Set up Command-E integration
- **Output**: Complete voice emulation system ready for use
- **Processing Time**: 5-10 seconds

## Technical Architecture

### Do We Still Need Trigger.dev?
**NO** - We can eliminate trigger.dev entirely because:
- Each step runs independently
- User controls timing between steps
- No need for complex orchestration
- Simpler debugging and development

### Timeout Solutions

#### **Short Steps (< 5 minutes)**
- Run directly in Vercel serverless functions
- Steps 1, 2, 3, 6, 7, 8, 9, 10 can run normally
- Use progress indicators for multi-URL processing

#### **Long Steps (20+ minutes) - Twitter/LinkedIn**
**Problem**: Apify actors can take 20+ minutes, but Vercel max timeout is 5 minutes

**Solution Options**:

1. **Async Job Pattern** (RECOMMENDED):
   ```typescript
   // Step 4: Start Twitter job
   POST /api/voice-emulator/twitter/start
   - Trigger Apify actor
   - Return job ID immediately
   - Store job ID in database

   // Polling mechanism
   GET /api/voice-emulator/twitter/status/{jobId}
   - Check Apify actor status
   - Return progress/completion

   // User Experience
   - Show "Processing..." with polling
   - User can navigate away and come back
   - Auto-refresh when job completes
   ```

2. **Background Service** (Alternative):
   - Deploy separate service (Railway, Render, etc.)
   - Webhook callbacks to update database
   - Vercel just triggers and polls

3. **Split Into Micro-Steps** (Fallback):
   - Step 4a: Configure Twitter extraction
   - Step 4b: Start Twitter job
   - Step 4c: Monitor progress (with pause/resume)
   - Step 4d: Review results

### Data Storage Strategy

#### **Database (Neon) - Structured Data**
```sql
-- Pipeline sessions
CREATE TABLE voice_emulator_sessions (
  id UUID PRIMARY KEY,
  creator_name TEXT NOT NULL,
  current_step INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step data
CREATE TABLE session_steps (
  session_id UUID REFERENCES voice_emulator_sessions(id),
  step_index INTEGER,
  status TEXT, -- 'pending', 'in_progress', 'completed', 'skipped'
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  completed_at TIMESTAMP
);

-- Long-running jobs
CREATE TABLE async_jobs (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES voice_emulator_sessions(id),
  step_index INTEGER,
  job_type TEXT, -- 'twitter', 'linkedin'
  external_job_id TEXT, -- Apify run ID
  status TEXT,
  result_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **Vercel Blob Storage - Large Content**
- Raw extracted content (before processing)
- Backup of all scraped data
- Generated documents (before Google Drive upload)

### API Route Structure
```
/api/voice-emulator/
├── session/
│   ├── create          # Create new session
│   ├── [id]/           # Get session data
│   └── [id]/update     # Update session
├── steps/
│   ├── discovery       # Step 2: Source discovery
│   ├── classification  # Step 3: URL classification  
│   ├── twitter/
│   │   ├── start       # Step 4: Start Twitter job
│   │   └── status/[id] # Check Twitter job status
│   ├── linkedin/
│   │   ├── start       # Step 5: Start LinkedIn job
│   │   └── status/[id] # Check LinkedIn job status
│   ├── blog            # Step 6: Blog extraction
│   ├── newsletter      # Step 7: Newsletter extraction
│   ├── analyze         # Step 9: Voice analysis
│   └── generate        # Step 10: Document generation
```

### UI Components Structure
```
components/voice-emulator/
├── VoiceEmulatorFlow.tsx      # Main stepper component
├── steps/
│   ├── CreatorSetup.tsx       # Step 1
│   ├── SourceDiscovery.tsx    # Step 2
│   ├── URLClassification.tsx  # Step 3
│   ├── TwitterExtraction.tsx  # Step 4 (with async handling)
│   ├── LinkedInExtraction.tsx # Step 5 (with async handling)
│   ├── BlogExtraction.tsx     # Step 6
│   ├── NewsletterExtraction.tsx # Step 7
│   ├── ContentReview.tsx      # Step 8
│   ├── VoiceAnalysis.tsx      # Step 9
│   └── DocumentGeneration.tsx # Step 10
├── shared/
│   ├── ProgressBar.tsx        # For multi-URL processing
│   ├── AsyncJobMonitor.tsx    # For Twitter/LinkedIn jobs
│   ├── ContentPreview.tsx     # Preview extracted content
│   └── EditableList.tsx       # Edit URL/content lists
```

### Error Handling & Recovery
- **Automatic Save**: Each step saves to database on completion
- **Resume Capability**: User can refresh/leave and resume where they left off
- **Retry Logic**: Failed steps can be retried individually
- **Skip Options**: User can skip optional steps (Twitter, LinkedIn)
- **Manual Fallbacks**: User can manually add content if automation fails

### Performance Optimizations
1. **Lazy Loading**: Only load step components when reached
2. **Caching**: Cache Firecrawl results, API responses
3. **Debouncing**: Debounce user edits to avoid excessive API calls
4. **Progress Indicators**: Show real progress for multi-URL operations
5. **Streaming**: Stream results as they become available

### Migration from Current System
1. **Keep Current Pipeline**: Maintain trigger.dev version for comparison
2. **Gradual Rollout**: A/B test new step-by-step UI
3. **Data Migration**: Export existing results to new schema
4. **Feature Parity**: Ensure all current features available in new UI

## Benefits of New Architecture
1. **User Control**: Edit inputs/outputs at every step
2. **Transparency**: See exactly what's happening
3. **Reliability**: Recover from individual step failures
4. **Debugging**: Identify issues immediately
5. **Flexibility**: Skip steps, customize processing
6. **Progress Visibility**: Never wonder what's happening
7. **Resumable**: Leave and come back later
8. **No Timeouts**: Handle long operations properly

## Implementation Priority
1. **Phase 1**: Build basic stepper UI (Steps 1-3, 8-10)
2. **Phase 2**: Add async job handling (Steps 4-5)
3. **Phase 3**: Add advanced editing/customization
4. **Phase 4**: Polish UX, add analytics
5. **Phase 5**: Deprecate trigger.dev version

## Conclusion
The step-by-step approach eliminates timeout issues, provides user control, and creates a much better user experience. We can remove trigger.dev entirely and use a combination of Vercel serverless functions + Neon database + async job patterns for long-running operations.