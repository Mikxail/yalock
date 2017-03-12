var Shavaluator = require('redis-evalsha');
var luaScripts = require('./lua-scripts');

function Scripts(){
    this._scripts = luaScripts;
    this._shavulators = {};
}

Scripts.prototype.init = function (client) {
    var id = client.connection_id;

    if (!this._shavulators[id]) {
        this._shavulators[id] = new Shavaluator(client);
        var name;
        for (name in this._scripts) {
            if (this._scripts.hasOwnProperty(name)) {
                this._shavulators[id].add(name, this._scripts[name]);
            }
        }
    }
    return this._shavulators[id];
};

module.exports = new Scripts();