import { NextRequest, NextResponse } from 'next/server'
import { jobQueue } from '@/lib/queue/simple-job-queue'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params
    
    // Get the job status from our queue
    const job = jobQueue.getJob(jobId)
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }
    
    // Build response
    const response: any = {
      jobId,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    }
    
    // Add output if completed
    if (job.status === 'completed' && job.result) {
      response.result = job.result
      response.googleDocsUrl = job.result.googleDocsUrl
    }
    
    // Add error if failed
    if (job.status === 'failed') {
      response.error = job.error || 'Job failed'
    }
    
    // Add progress if available
    if (job.progress) {
      response.progress = job.progress
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error checking job status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check job status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}