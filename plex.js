var PlexAPI = require("plex-api");

var TYPES = {
  MOVIE: 'movie',
  EPISODE: 'episode',
};

var TYPE_MAP = {
  [TYPES.MOVIE]: '1',
  [TYPES.EPISODE]: '2',
};

module.exports = (config) => {
  var client = new PlexAPI(config);

  var recentlyAdded = function (type, limit) {
    var typeNum = TYPE_MAP[type];

    return new Promise(function (resolve, reject) {
      client.query({
        'uri': '/hubs/home/recentlyAdded?type=' + typeNum,
        'extraHeaders': {
          'X-Plex-Container-Start': '0',
          'X-Plex-Container-Size': limit.toString(),
        },
      })
        .then(function (result) {
          var data = result.MediaContainer.Metadata
            .filter((item) => item.type === type);

          resolve(data);
        }, reject);
    });
  }

  return {
    recentlyAdded: recentlyAdded,
  };
}

module.exports.TYPES = TYPES;
