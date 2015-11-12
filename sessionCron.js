var CronJob = require('cron').CronJob;
var sessionManager = require('./index');
var crons = [];

// Time definitions
var CRON_TIMES = {
    // Run a job at 4AM. Other jobs don't run at this time
    FOURAM: '00 04 * * *',
    // Eleven PM
    ONEAM: '00 01 * * *',
    // Every minute
    EVERYMINUTE: '* * * * *'
};


exports.start = function() {
    exports.stop();

    var SESSION_CHECK = new CronJob(
        CRON_TIMES.FOURAM,
        sessionManager.checkSessions,
        null,
        true,
        null
        );

    crons = [
        SESSION_CHECK
    ];
};


exports.stop = function() {
    crons.forEach(function(cron) {
        cron.stop();
    });
};

function serverRestart () {
  process.exit();
}

exports.start();