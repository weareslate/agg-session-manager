var CronJob = require('cron').CronJob;

module.exports = function(session) {
    var CRON_TIMES = {
        FOURAM: '00 04 * * *',      // Run a job at 4AM. Other jobs don't run at this time
        ONEAM: '00 01 * * *',       // Eleven PM
        EVERYMINUTE: '* * * * *'    // Every minute
    };
    var crons = [];

    console.log('Cron');

    function start() {
        console.log('Starting cron jobs');
        stop();

        var SESSION_CHECK = new CronJob(
            CRON_TIMES.FOURAM,
            function() {
                // needed to wrap the function as it wouldn't call it without
                session.checkSessions()
            },
            null,
            true,
            null
            );

        crons = [
            SESSION_CHECK
        ];
    }

    function stop() {
        crons.forEach(function(cron) {
            cron.stop();
        });
    }

    return {
        start: start,
        stop: stop
    };
}