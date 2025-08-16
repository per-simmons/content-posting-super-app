const { runs } = require("@trigger.dev/sdk/v3");

async function cancelAndRetry() {
  try {
    const stuckRunId = "run_cmedcz7ae0gw827n8w38pbw3f";
    
    console.log(`Canceling stuck run: ${stuckRunId}`);
    await runs.cancel(stuckRunId);
    console.log("✅ Successfully canceled stuck job");
    
    // Check status after cancellation
    const canceledRun = await runs.retrieve(stuckRunId);
    console.log("Canceled job status:", canceledRun.status);
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

cancelAndRetry();