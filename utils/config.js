//Takes the object loaded by node-config as an argument
module.exports = function(config) {
    var module = {};
    module.port = config.get('port');
    module.cookieSecret = config.get('cookieSecret');
    if (config.has('production'))
        module.isProduction = config.get('production');
    else
        module.isProduction = false;
    console.log("Loaded config:\n" + JSON.stringify(module));
    return module;
}
