var sessionModel = require('./sessionModel');
var sessionCron = require('./sessionCron');
var moment = require('moment');
var crypto = require('crypto');

var error = {'status': 'error', 'message': 'There was an error' }

// create session
exports.createSession = function(username, callback) {

	console.log('Creating session for user %s', username);
	
	var token = createToken(username);

	var session = {
		createdTimestamp: +new Date(),
		username: username,
		token: token
	};
	sessionModel.create(session, function(err, res) {
		if (err) {
			error.message = err;
			return callback(error);
		}

		callback(null, token);
	});
}

// create token
function createToken (username) {
	
    var current_date = (new Date()).valueOf().toString();
    var random = Math.random().toString();
    var token = crypto.createHash('sha1').update(username + current_date + random).digest('hex');

	return token;
}

// check if logged in
exports.isLoggedInMiddleware = function (req, res, next) {

	console.log('Middleware is checking for a session...')
	exports.validateSession(req.body.token, function(err, msg) {
		if (err) {
			return res.json(error);
		}

		if (!msg.sessionValid) {
			error.message = 'Not authorised';
			return res.json(error);
		}

		// append the username to the request so that it can be used elsewhere
		req.username = msg.username;

		next()
	});
}

// validate session
exports.validateSession = function (token, callback) {

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
		if (record.fields.token) {
			var createdOn = moment(record.fields.createdTimestamp);
			var now = moment();
			// TODO envirnoment var
			if (now.diff(createdOn, 'days') < 3650) {
				console.log('Found valid session');
				response.status = 'success';
				response.data.sessionValid = true;
				response.username = record.fields.username
			} 
		}

		callback(null, response);
	});
}

// delete session
exports.deleteSession = function (token, callback) {

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
}

exports.checkSessions = function (body, callback) {
	// called by cron job to check for expired sessions
	console.log('checking sessions...');
}
