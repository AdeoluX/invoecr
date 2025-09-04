const cron = require("node-cron");
const { SubscriptionService } = require("../services/subscription.service");

/**
 * Subscription Renewal Cron Jobs
 *
 * This utility sets up automated cron jobs to handle subscription renewals
 * It can be imported and initialized in your main application
 */

class SubscriptionCronJobs {
  constructor() {
    this.jobs = new Map();
  }

  /**
   * Initialize all subscription renewal cron jobs
   */
  init() {
    this.setupDailyRenewalCheck();
    this.setupWeeklyRenewalProcessing();
    console.log("✅ Subscription renewal cron jobs initialized");
  }

  /**
   * Setup daily check for subscriptions needing renewal
   * Runs every day at 9:00 AM
   */
  setupDailyRenewalCheck() {
    const job = cron.schedule("0 9 * * *", async () => {
      try {
        console.log("🕐 Daily subscription renewal check started");

        const entitiesNeedingRenewal =
          await SubscriptionService.getSubscriptionsNeedingRenewal(7);

        if (entitiesNeedingRenewal.length > 0) {
          console.log(
            `📅 Found ${entitiesNeedingRenewal.length} subscriptions needing renewal in the next 7 days`
          );

          // Log entities needing renewal for monitoring
          entitiesNeedingRenewal.forEach((entity) => {
            console.log(
              `  - Entity ${entity.entityId}: ${entity.currentPlan} plan expires in ${entity.daysUntilExpiry} days`
            );
          });
        } else {
          console.log("✅ No subscriptions need renewal in the next 7 days");
        }
      } catch (error) {
        console.error("❌ Daily renewal check failed:", error.message);
      }
    });

    this.jobs.set("dailyRenewalCheck", job);
    console.log("📅 Daily renewal check cron job scheduled (9:00 AM daily)");
  }

  /**
   * Setup weekly automatic renewal processing
   * Runs every Sunday at 2:00 AM
   */
  setupWeeklyRenewalProcessing() {
    const job = cron.schedule("0 2 * * 0", async () => {
      try {
        console.log("🔄 Weekly automatic renewal processing started");

        const results = await SubscriptionService.processAutomaticRenewals(7);

        console.log("📊 Automatic renewal results:", {
          processed: results.processed,
          successful: results.successful,
          failed: results.failed,
          errors: results.errors.length,
        });

        if (results.errors.length > 0) {
          console.log("❌ Renewal errors:", results.errors);
        }
      } catch (error) {
        console.error("❌ Weekly renewal processing failed:", error.message);
      }
    });

    this.jobs.set("weeklyRenewalProcessing", job);
    console.log(
      "🔄 Weekly renewal processing cron job scheduled (2:00 AM Sundays)"
    );
  }

  /**
   * Setup custom renewal check (for testing or specific intervals)
   * @param {string} schedule - Cron schedule expression
   * @param {number} daysAhead - Days ahead to check
   */
  setupCustomRenewalCheck(schedule, daysAhead = 7) {
    const jobId = `customRenewalCheck_${Date.now()}`;

    const job = cron.schedule(schedule, async () => {
      try {
        console.log(
          `🕐 Custom renewal check started (${daysAhead} days ahead)`
        );

        const entitiesNeedingRenewal =
          await SubscriptionService.getSubscriptionsNeedingRenewal(daysAhead);
        console.log(
          `📅 Found ${entitiesNeedingRenewal.length} subscriptions needing renewal`
        );

        return entitiesNeedingRenewal;
      } catch (error) {
        console.error("❌ Custom renewal check failed:", error.message);
        return [];
      }
    });

    this.jobs.set(jobId, job);
    console.log(`📅 Custom renewal check cron job scheduled: ${schedule}`);

    return jobId;
  }

  /**
   * Stop a specific cron job
   * @param {string} jobId - Job ID to stop
   */
  stopJob(jobId) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.stop();
      this.jobs.delete(jobId);
      console.log(`⏹️ Cron job stopped: ${jobId}`);
    } else {
      console.log(`⚠️ Job not found: ${jobId}`);
    }
  }

  /**
   * Stop all cron jobs
   */
  stopAll() {
    this.jobs.forEach((job, jobId) => {
      job.stop();
      console.log(`⏹️ Stopped cron job: ${jobId}`);
    });
    this.jobs.clear();
    console.log("🛑 All subscription renewal cron jobs stopped");
  }

  /**
   * Get status of all cron jobs
   */
  getStatus() {
    const status = {};
    this.jobs.forEach((job, jobId) => {
      status[jobId] = {
        running: job.running,
        nextDate: job.nextDate(),
        lastDate: job.lastDate(),
      };
    });
    return status;
  }
}

// Export singleton instance
const subscriptionCronJobs = new SubscriptionCronJobs();

module.exports = {
  SubscriptionCronJobs,
  subscriptionCronJobs,
};
