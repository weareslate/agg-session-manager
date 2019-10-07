var moment = require('moment');
var crypto = require('crypto');
var error = {'status': 'error', 'message': 'There was an error' };

var sessionMgr = function(cfg) {
	var session = {},
		collection = 'sessions',
		sessionTimeout = 86400, // 1 day
		sessionExtend = false,
		sessionModel,
		sessionCron;

	session.initialize = function (cfg) {
		cfg = cfg || {};

		collection = cfg.collection || collection;
		sessionTimeout = cfg.sessionTimeout || sessionTimeout;
		sessionExtend = cfg.sessionExtend || sessionExtend;

		sessionModel = require('./sessionModel')(collection);
		sessionCron = require('./sessionCron')(session);
		sessionCron.start();
	};

	session.initialize(cfg);

	// create session
	session.createSession = function (username, data, callback) {

		console.log('Creating session for user %s', username);

		// handle older implementation that might not send in data parameter
	    if (data) {
	    	if (typeof data === 'function') {
		        callback = data;
		        data = null;
		    }
		}

		console.log('[agg-session-manager] creating token');
		var token = createToken(username);

		// data can contain extra session information (e.g. E1 companies for Mixer Cabin app)
		var session = {
			createdTimestamp: +new Date(),
			username: username,
			token: token,
			data: data
		};

		console.log('[agg-session-manager] created session object, now creating session', session);
		sessionModel.create(session, function(err, res) {
			if (err) {
				console.log('[agg-session-manager] error creating session');
				error.message = err;
				return callback(error);
			}

			console.log('[agg-session-manager] no errors');
			callback(null, token);
		});
	};

	// check if logged in
	session.isLoggedInMiddleware = function (req, res, next) {

		console.log('Middleware is checking for a session...')
		var token = req.body.token ? req.body.token : req.query.token;
		session.validateSession(token, function(err, msg) {
			if (err) {
				return res.json(error);
			}

			if (msg.data && msg.data.message === 'Session has expired') {
				error.message = msg.data.message;
				return res.json(error);
			}

			if (!msg.data || !msg.data.sessionValid) {
				error.message = 'Not authorised';
				return res.json(error);
			}

			// append the username to the request so that it can be used elsewhere
			req.username = msg.data.username;
			req.sessionData = msg.data.sessionData;

			next()
		});
	};

	// validate session
	session.validateSession = function (token, callback) {

		var response = {'status': 'fail', 'data': {'sessionValid' : false} };

		console.log('Attempting to validate session with token: %s', token)

		sessionModel.readByToken(token, function(err, res) {
			if (err) {
				error.message = err;
				return callback(error);
			}

			if (!res.list) {
				error.message = 'No results list returned';
				return callback(error);
			}

			if (res.list.length === 0) {
				return callback(null, response);
			}

			var record = res.list[0];
			if (!record.fields.token) {
				return callback(null, response);
			}

			var createdOn = moment(record.fields.createdTimestamp);
			var now = moment();

			// check if the session is still active
			if (sessionTimeout && now.diff(createdOn, 'seconds') > sessionTimeout) {
				console.log('Session has expired');
				response.data.message = 'Session has expired';
				return callback(null, response);
			}

			// extend session
			if (sessionExtend) {
				record.fields.createdTimestamp = +new Date();
				sessionModel.update(record.guid, record.fields, function(err, res) {
					if (err) {
						return console.log(err);
					}
					console.log('Session extended until %s for token: %s', moment().add(sessionTimeout, 'seconds'), token);
				});
			}

			console.log('Found valid session');
			response.status = 'success';
			response.data.sessionValid = true;
			response.data.username = record.fields.username
			response.data.sessionData = record.fields.data

			callback(null, response);
		});
	};

	// delete session
	session.deleteSession = function (token, callback) {

		// sessionModel.deleteByUsername()
		console.log('Removing session token:  %s', token);

		sessionModel.readByToken(token, function(err, res) {
			if (err) {
				error.message = err;
				return callback(error);
			}

			if (!res.list) {
				error.message = 'No results list returned';
				return callback(error);
			}

			// there should only be one item in the list array
			var ids = []
			for (var i = 0; i < res.list.length; i++) {
				var record = res.list[i];
				if (record.guid) {
					// add the database id of the session to the ids array
					ids.push(record.guid);
				}
			};

			sessionModel.deleteTokensByIds(ids, function(err, res) {
				if (err) {
					error.message = err;
					return callback(error);
				}

				if (!res || res.length === 0) {
					return callback(null, {'status': 'fail', 'data': { 'message': 'No sessions removed' } });
				}

				callback(null, {
					'status': 'success',
					'data': { 'message': 'Session removed' }
				});
			});
		});
	};

	session.checkSessions = function (body, callback) {
		// simple logger function if no callback passed in
		callback = callback || logger;

		// called by cron job to check for expired sessions
		console.log('Checking for expired sessions in %s', collection);

		// expired sessions will have been created at a time before now - SESSION_TIMEOUT
		var timeNow = +new Date(),
			createdTime = timeNow - (sessionTimeout * 1000);

		sessionModel.findExpiredSessions(createdTime, function(err, res) {
			if (err) {
				error.message = err;
				return callback(error);
			}

			if (!res.list) {
				error.message = 'No results list returned';
				return callback(error);
			}

			// create an array of session IDs that will be deleted
			var ids = []
			for (var i = 0; i < res.list.length; i++) {
				if (res.list[i].guid) {
					// add the database id of the session to the ids array
					ids.push(res.list[i].guid);
				}
			};
			sessionModel.deleteTokensByIds(ids, function(err, res) {
				if (err) {
					error.message = err;
					return callback(error);
				}

				if (!res || res.length === 0) {
					return callback(null, 'No sessions removed');
				}

				callback(null, 'Removed ' + res.length + ' sessions from ' + collection);
			});
		});
	};

	return session;
}

// create token
var createToken = function(username) {

    var current_date = (new Date()).valueOf().toString();
    var random = Math.random().toString();
    var token = crypto.createHash('sha1').update(username + current_date + random).digest('hex');

	return token;
}

var logger = function (err, msg) {
	if (err) {
		return console.log(err);
	}
	console.log(msg);
};

module.exports = sessionMgr;