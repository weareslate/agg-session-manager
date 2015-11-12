var sessionModel = require('./sessionModel');
var sessionCron = require('./sessionCron');
var moment = require('moment');

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
			return callback(err);
		}

		callback(null, token);
	});
}

// create token
function createToken (username) {
	// TODO return hash
	return username + (+new Date());
}

// validate session
exports.validateSession = function (token, callback) {
	// body...
	var sessionValid = false;
	console.log('Attempting to validate session with token: %s', token)

	sessionModel.readByToken(token, function(err, res) {
		if (err) {
			return callback(err);
		}
		// TODO check res.list exists
		for (var i = 0; i < res.list.length; i++) {
			var record = res.list[i];
			if (record.fields.token) {
				var createdOn = moment(record.fields.createdTimestamp);
				var now = moment();
				// TODO envirnoment var
				if (now.diff(createdOn, 'days') < 90) {
					console.log('Found valid session');
					sessionValid = true;
				}
			}
		};

		callback(null, sessionValid);
	});
}

// delete session
exports.deleteSession = function (body, callback) {
	// body...
	var token = body.token;
	// sessionModel.deleteByUsername()

	sessionModel.readByToken(token, function(err, res) {
		if (err) {
			return callback(err);
		}
		// TODO check res.list exists
		var ids = []
		for (var i = 0; i < res.list.length; i++) {
			var record = res.list[i];
			if (record.fields._id) {
				ids.push(record.fields._id);
			}
		};

		sessionModel.deleteTokensByIds(ids, function(err, res) {
			if (err) {
				return callback(err);
			}

			callback(null, res);
		});
	});
}

exports.checkSessions = function (argument) {
	// body...
	console.log('checking sessions...');
}
