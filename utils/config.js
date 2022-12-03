const debug = require('debug')('tgrgbox:config');
//Takes the object loaded by node-config as an argument
module.exports = function(config) {
    var module = {};
    module.port = config.get('port');
    module.cookieSecret = config.get('cookieSecret');
    module.siteName = config.get('siteName');
    if (config.has('development'))
        module.isProduction = !config.get('development');
    else
        module.isProduction = true;
    //Load the discord oauth info
    module.discord = config.get('discord');
    if (!module.discord.clientId)
        throw 'Missing discord clientId';
    if (!module.discord.clientSecret)
        throw 'Missing discord clientSecret';
    if (!module.discord.callbackUrl)
        throw 'Missing discord callbackUrl';

    //Load the users into a set
    var usersArray = config.get('users');
    module.users = new Set(usersArray);

    //map of url keys to (protocol,url,file) tuples (file is optional
    module.urls = new Map(Object.entries(config.get('urls')).map( ([key, value]) => [key, { 'name': key, 'protocol': value.protocol, 'url': value.url, 'file': value.file} ]));

    var channelsObject = config.get('channels');
    //Load the channels into a list from channel name to its details.  Preserve
    //the list order from the config so we know which one is "primary"
    var channelsList = Object.entries(channelsObject).map( ([key, value]) => ({ 'name': key, 'title': value.title, 'app': value.app, 'stream': value.stream, 'streamKey': value.key }));
    //debug("channels map:\n%O", channelsList);
    module.channels = channelsList;
    //and a second from streamer to their list of allowed channels
    var streamerMap = new Map();
    Object.entries(channelsObject).forEach(([key, value]) => {
        value.users.forEach((username) => {
            if (!module.users.has(username)) {
                throw username + ' is in the streamer list but not in the users list';
            }
            if (!streamerMap.has(username)) {
                streamerMap.set(username, []);
            }
            streamerMap.get(username).push(key);
        });
    });
    module.streamers = streamerMap;
    //debug("streamer map:\n%O", streamerMap);

    debug("final config object:\n%O", module);
    return module;
}
