var dal = require('agg-mongo-dal');

module.exports = function(collection) {
	var model = {};

	collection = collection || 'sessions';

	// console.log('Session model is being used with collection: %s', collection);

	model.create = function (session, callback) {
		console.log('Creating a session in collection: %s', collection);
		console.log('test');
		dal.create(collection, session, callback);
	};

	model.readByToken = function (token, callback) {
		var restrictions = {
			eq: {
				token: token
			}
		}
    console.log(dal);
    console.log(dal.hasOwnProperty('list'));
    console.log('Calling dal.list', collection, restrictions, callback);
		dal.list(collection, restrictions, callback);
	};

	model.deleteTokensByIds = function (ids, callback) {
		dal.removeByIds(collection, ids, callback);
	};

	model.update = function(guid, fields, callback) {
	    dal.update(collection, guid, fields, callback);
	};

	model.findExpiredSessions = function(createdTime, callback) {
		var restrictions = {
			lt: {
				createdTimestamp: createdTime
			}
		};
		dal.list(collection, restrictions, callback);
	};

	return model;
}
