var Lock = require('./lock');

function LockManager(client, options){
    if (typeof client != 'function') {
        client = (function(rc, rcOpts){
            rcOpts = rcOpts || {};
            return function(){
                return rc.createClient(rcOpts);
            }
        })(require('redis'), client);
    }

    this._createClient = client;
    this._client = this._createClient.call(null);
    options = options || {};
    this._options = options;
    this._ttl = this._options.ttl || 3000;
}

LockManager.prototype.createLock = function (lockName, lockOptions) {
    lockOptions = lockOptions || {};
    lockOptions = Object.assign({}
        , this._options
        , {name: lockName}
        , lockOptions
    );
    return new Lock(this._client, lockOptions);
};

LockManager.prototype.tryLock = function (lockName, ttl, callback) {
    if (typeof ttl == 'function') {
        callback = ttl;
        ttl = null;
    }

    var lock = this.createLock(lockName, {ttl: ttl});
    return lock.tryLock(function(err, isLocked){
        if (err) return callback(err);
        callback(null, lock.unlock.bind(lock), isLocked, lock);
    });
};

LockManager.prototype.lock = function (lockName, ttl, maxAttempts, maxWait, callback) {
    var lock = this.createLock(lockName, {ttl: ttl, maxAttempts, maxWait: maxWait});
    return lock.lock(function(err, isLocked){
        if (err) return callback(err);
        callback(null, lock.unlock.bind(lock), isLocked, lock);
    });
};

LockManager.prototype.unlock = function (lockName, callback) {
    var lock = this.createLock(lockName);
    return lock.unlock(function(err, isUnlocked){
        if (err) return callback(err);
        callback(null, isUnlocked, lock);
    });
};

LockManager.prototype.tryUpdateLock = function (lockName, ttl, callback) {
    if (typeof ttl == 'function') {
        callback = ttl;
        ttl = null;
    }

    var lock = this.createLock(lockName, {ttl: ttl});
    return lock.tryUpdateLock(function(err, isLocked){
        if (err) return callback(err);
        callback(null, lock.unlock.bind(lock), isLocked, lock);
    });
};


module.exports = LockManager;