# agg-session-manager
Session manager for Aggregate Industries

## Usage
Session manager now needs to be run (with optional config) when required:

```config = {
    collection: 'usersessions', 
    sessionExtend: false, 
    sessionTimeout: 3600 // 1 hour
};
var userSessionManager = require('agg-session-manager')(sessionConfig);```

## Creating a session

```userSessionManager.createSession(username, additionalData, function(err, token){
    if (err) {
    	return console.log(err);
    }
    console.log('Login successful for %s', username);
    console.log(token));
});```