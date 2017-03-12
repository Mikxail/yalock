var uuid = require('uuid').v4;
var Scripts = require('./scripts');

function Lock(client, options){
    this._client = client;
    this._options = options || {};
    this._lockUUID = uuid();
    this._until = null;
    this._name = this._options.name;
    this._lockName = "lock." + this._name;
    this._ttl = this._options.ttl || 3000;
    this._maxAttempts = this._options.maxAttempts;
    this._maxWait = this._options.maxWait;
    if (typeof this._maxAttempts == 'undefined') {
        this._maxAttempts = Infinity;
    }
    if (typeof this._maxWait == 'undefined') {
        this._maxWait = Infinity;
    }
    this._retryTimeout = this._options.retryTimeout || 50;
    if (this._retryTimeout < 50) {
        console.warn("'lock.retryTimeout' is extremely short. Recommended values >= 50.")
    }

    this._scripts = Scripts.init(this._client);
}

Lock.prototype.tryLock = function (callback) {
    var d = Date.now();
    this._acquireLock(function(err, timeout){
        if (err) {
            if (err != Lock.LockAcquireError) {
                return callback(err, false);
            } else {
                return callback(null, false);
            }
        } else {
            this._until = d + timeout;
            return callback(null, true);
        }
    });
};

Lock.prototype.lock = function (callback) {
    this._attemptLock(this._maxAttempts, Date.now() + this._maxWait, callback);
};

Lock.prototype.unlock = function (callback) {
    var self = this;
    this._scripts.exec('delifequal', [this._lockName], [this._getLockValue()], function(err, isOk){
        if (err) return callback(err, false);
        self._until = null;
        if (!isOk) return callback(null, false);
        callback(null, true);
    });
};

Lock.prototype.tryUpdateLock = function (callback) {
    var self = this;
    var d = Date.now();
    this._scripts.exec('pexpireifequal', [this._lockName], [this._getLockValue(), this._ttl], function(err, isOk){
        if (err) return callback(err, false);
        if (!isOk) {
            self._until = null;
            return callback(null, false);
        }
        self._until = d + self._ttl;
        callback(null, true);
    });
};

Lock.prototype.getUntilTime = function () {
    return this._until;
};



Lock.prototype._attemptLock = function (retries, untilTime, callback) {
    var self = this;
    this.tryLock(function(err, isOk){
        if (err || !isOk) {
            if (retries && Date.now() <= untilTime) {
                setTimeout(function(){
                    self._attemptLock(--retries, untilTime, callback);
                }, self._retryTimeout);
            } else {
                callback(err, isOk);
            }
        } else {
            callback(null, true);
        }
    });
};

Lock.prototype._acquireLock = function (callback) {
    var lockVal = this._getLockValue();

    var self = this;
    this._client.set(this._lockName, lockVal, 'PX', this._ttl, 'NX', function(err, res){
        if (err) return callback(err);
        if (res === null) return callback(Lock.LockAcquireError);
        callback(null, self._ttl);
    });
};

Lock.prototype._getLockValue = function () {
    return this._lockUUID;
};

Lock.LockAcquireError = new Error("can't lock");

module.exports = Lock;