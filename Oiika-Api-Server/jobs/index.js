const tutorStats = require('./tutor-stats');
const CronJob = require('cron').CronJob;

var tutorStatsJob;

module.exports = {   

  startAllJobs: () => {

    tutorStatsJob = new CronJob('00 00 * * * *', function() {

      tutorStats.calculateTutorStats();

    }, null, true);

  },

  stopAllJobs: () => {

    tutorStatsJob || tutorStatsJob.stop();

  }

}