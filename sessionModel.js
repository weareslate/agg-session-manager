var dal = require('agg-mongo-dal');
var collection = 'sessions';

exports.create = function (session, callback) {
	dal.create(collection, session, callback);
}

exports.readByToken = function (token, callback) {
	var restrictions = {
		eq: {
			token: token
		}
	}
	dal.list(collection, restrictions, callback);
}

exports.deleteTokensByIds = function (ids, callback) {
	dal.removeByIds(collection, ids, callback);
}

exports.update = function(guid, fields, callback) {
    dal.update(collection, guid, fields, callback);
}

exports.findExpiredSessions = function(createdTime, callback) {
	var restrictions = {
		lt: {
			createdTimestamp: createdTime
		}
	};
	dal.list(collection, restrictions, callback);
};