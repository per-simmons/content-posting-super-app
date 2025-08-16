const { runs } = require("@trigger.dev/sdk/v3");

async function checkRunStatus() {
  try {
    const runId = "run_cmedcz7ae0gw827n8w38pbw3f";
    console.log(`Checking status for run: ${runId}`);
    
    const run = await runs.retrieve(runId);
    
    console.log("Run Details:");
    console.log("- Status:", run.status);
    console.log("- Created At:", run.createdAt);
    console.log("- Updated At:", run.updatedAt);
    console.log("- Task ID:", run.taskIdentifier);
    
    if (run.output) {
      console.log("- Output:", JSON.stringify(run.output, null, 2));
    }
    
    if (run.error) {
      console.log("- Error:", run.error);
    }
    
  } catch (error) {
    console.error("Error checking run status:", error.message);
  }
}

checkRunStatus();