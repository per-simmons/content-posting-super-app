// Simple in-memory job queue for development
// In production, you'd want to use Redis or a database for persistence

interface Job {
  id: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'canceled'
  createdAt: Date
  updatedAt: Date
  data: any
  result?: any
  error?: string
  progress?: {
    message: string
    percentage: number
  }
}

class SimpleJobQueue {
  private jobs: Map<string, Job> = new Map()
  private runningJobs: Set<string> = new Set()
  
  createJob(data: any): string {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const job: Job = {
      id: jobId,
      status: 'queued',
      createdAt: new Date(),
      updatedAt: new Date(),
      data
    }
    this.jobs.set(jobId, job)
    return jobId
  }
  
  async processJob(jobId: string, processor: (job: Job) => Promise<any>): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job) throw new Error('Job not found')
    
    // Mark as running
    job.status = 'running'
    job.updatedAt = new Date()
    this.runningJobs.add(jobId)
    
    try {
      // Process the job
      const result = await processor(job)
      
      // Mark as completed
      job.status = 'completed'
      job.result = result
      job.updatedAt = new Date()
    } catch (error) {
      // Mark as failed
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      job.updatedAt = new Date()
      throw error
    } finally {
      this.runningJobs.delete(jobId)
    }
  }
  
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId)
  }
  
  updateProgress(jobId: string, message: string, percentage: number): void {
    const job = this.jobs.get(jobId)
    if (job) {
      job.progress = { message, percentage }
      job.updatedAt = new Date()
    }
  }
  
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId)
    if (job && (job.status === 'queued' || job.status === 'running')) {
      job.status = 'canceled'
      job.updatedAt = new Date()
      this.runningJobs.delete(jobId)
      return true
    }
    return false
  }
  
  // Clean up old jobs (older than 1 hour)
  cleanup(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.updatedAt < oneHourAgo && !this.runningJobs.has(jobId)) {
        this.jobs.delete(jobId)
      }
    }
  }
}

// Export singleton instance
export const jobQueue = new SimpleJobQueue()