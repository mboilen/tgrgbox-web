const debug = require('debug')('tgrgbox:config');
const crypto = require('node:crypto');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const base62 = require('base62-ts');
function makeSecret(size) {
    var ints = [];
    for (var i = 0; i < size; ++i) {
        ints.push(crypto.randomInt(281474976710655));
    }
    var secret = ints.map( (i) => base62.encode(i) ).join("");
    return secret;
}
function getOrCreateSecret(data, key, size) {
    if (data.hasOwnProperty(key)) {
        return data[key];
    }
    var secret = makeSecret(size);
    data[key] = secret;
    return secret;
}
//Takes the object loaded by node-config as an argument
module.exports = function(config, datapath) {
    const SHORT_SECRET_SIZE = 2;
    const LONG_SECRET_SIZE = 6;
    //load the data file from disk if it exists.
    var DATA_NAME = path.join(datapath, 'data.json');
    var savedData;
    try {
        savedData = JSON.parse(fs.readFileSync(DATA_NAME, 'utf8'));
    } catch (err) {
        console.error('error reading ' + DATA_NAME + ' ' + err);
        savedData = {};
    }
    debug('loaded saved data: %O', savedData);

    //copy the object so we can see if we've updated it at all.
    var currentData = Object.assign({}, savedData);

    var module = {};
    module.port = config.get('port');
    module.cookieSecret = getOrCreateSecret(currentData, 'cookieSecret', SHORT_SECRET_SIZE);
    module.siteName = config.get('siteName');
    //This is a random string that is inserted into streaming urls.  It's only valid for the lifetime of the server (for now)
    module.streamSecret = getOrCreateSecret(currentData, 'streamSecret', SHORT_SECRET_SIZE);
    if (config.has('development'))
        module.isProduction1 = !config.get('development');
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

    //map of url keys to (protocol,url,file) tuples (file is optional)
    module.urls = new Map(Object.entries(config.get('urls')).map( ([key, value]) => [key, { 'name': key, 'protocol': value.protocol, 'url': value.url, 'file': value.file} ]));

    //this remains an object
    module.ingest = config.get('ingest');

    var channelsObject = config.get('channels');
    //Load the channels into a list from channel name to its details.  Preserve
    //the list order from the config so we know which one is "primary"
    var channelsList = Object.entries(channelsObject).map( ([key, value]) => ({ 'name': key, 'title': value.title, 'app': value.app, 'stream': value.stream, 'streamKey': getOrCreateSecret(currentData, 'stream.' + key, LONG_SECRET_SIZE) }));

    //make sure that the stream keys are unique
    var streamKeys = new Set();
    channelsList.forEach((channel) => {
        if (streamKeys.has(channel.streamKey)) {
            throw "Stream key " + channel.streamKey + " is not unique";
        }
        streamKeys.add(channel.streamKey);
    });
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
    //save the secrets object if it was modified
    if (!_.isEqual(savedData, currentData)) {
        debug('current data is %O', currentData);
        fs.writeFileSync(DATA_NAME, JSON.stringify(currentData, null, "  "));
    }

    return module;
}
