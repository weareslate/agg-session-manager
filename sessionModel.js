var dal = require('agg-mongo-dal');
var collection = 'sessions';

module.exports = {
	init: function (cfg) {
		if (cfg && cfg.collection) {
			collection = cfg.collection
		};
	},

	create: function (session, callback) {
		dal.create(collection, session, callback);
	},

	readByToken: function (token, callback) {
		var restrictions = {
			eq: {
				token: token
			}
		}
		dal.list(collection, restrictions, callback);
	},

	deleteTokensByIds: function (ids, callback) {
		dal.removeByIds(collection, ids, callback);
	},

	update: function(guid, fields, callback) {
	    dal.update(collection, guid, fields, callback);
	},

	findExpiredSessions: function(createdTime, callback) {
		var restrictions = {
			lt: {
				createdTimestamp: createdTime
			}
		};
		dal.list(collection, restrictions, callback);
	}
}