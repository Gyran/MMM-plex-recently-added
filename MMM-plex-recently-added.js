
var NOTIFICATIONS = {
  CONFIG: 'CONFIG',
  DATA: 'DATA',
  ERROR: 'ERROR',
};

Module.register('MMM-plex-recently-added', {
  recentlyAdded: {},

  defaults: {
    updateInterval: 10 * 60 * 1000,
    types: ['movie', 'episode'],
    limit: 20,
    token: '',
    hostname: '127.0.0.1',
    port: '32400',
  },

  start: function() {
    this.sendSocketNotification('CONFIG', this.config);
  },

  socketNotificationReceived: function(notification, payload) {
    // console.log('Got notification', notification, payload);
    if (notification === NOTIFICATIONS.DATA) {
      this.recentlyAdded[payload.type] = payload.items;
      this.updateDom();
    } else if (notification === NOTIFICATIONS.ERROR) {
      Log.error(payload.error);
    }
  },

  getStyles: function() {
    return ["MMM-plex-recently-added.css"];
  },

  getDom() {
    var self = this;
    var wrapper = document.createElement('div');

    this.config.types.forEach(function (type) {
      var items = self.recentlyAdded[type];
      if (items) {
        recentlyAddedListDom = self._getRecentlyAddedListDom(items);
        wrapper.appendChild(recentlyAddedListDom);
      }
    });

    return wrapper;
  },

  _getThumbUrl(item) {
    var thumbKey = 'thumb';
    if (item.type === 'episode') {
      thumbKey = 'parentThumb';
    }
    return 'http://' + this.config.hostname + ':' + this.config.port + item[thumbKey] + '?X-Plex-Token=' + this.config.token;
  },

  _appendMetadataField(metadataDom, item, field) {
    var fieldValue = item[field];
    if (fieldValue) {
      var dom = document.createElement('div');
      dom.classList.add(field);
      dom.innerText = fieldValue;
      metadataDom.appendChild(dom);
    }
  },

  _getMetadataDom(item) {
    var type = item.type;

    var metadataDom = document.createElement('div');
    metadataDom.classList.add('metadata');
    metadataDom.classList.add(type);

    if (type === 'episode') {
      this._appendMetadataField(metadataDom, item, 'grandparentTitle');
      this._appendMetadataField(metadataDom, item, 'title');
      var SeasonEpisodeDom = document.createElement('div');
      SeasonEpisodeDom.classList.add('SeasonEpisode');
      SeasonEpisodeDom.innerText = 'S' + item.parentIndex + ' E' + item.index;
      metadataDom.appendChild(SeasonEpisodeDom);
    } else {
      this._appendMetadataField(metadataDom, item, 'title');
      this._appendMetadataField(metadataDom, item, 'year');
    }

    return metadataDom;
  },

  _getItemDom(item) {
    var itemDom = document.createElement('li');
    itemDom.classList.add('item');

    var posterDom = document.createElement('div');
    posterDom.classList.add('poster');
    var thumbUrl = this._getThumbUrl(item);
    posterDom.style.backgroundImage = 'url(' + thumbUrl + ')';
    posterDom.style.backgroundSize = 'cover';
    itemDom.appendChild(posterDom);

    var metadataDom = this._getMetadataDom(item);
    itemDom.appendChild(metadataDom);

    return itemDom;
  },

  _getRecentlyAddedListDom(items) {
    if (!items) {
      return null;
    }

    var libraryDom = document.createElement('ul');
    libraryDom.classList.add('recentlyAddedList');

    var self = this;
    items.forEach(function (item) {
      var itemDom = self._getItemDom(item);

      libraryDom.appendChild(itemDom);
    });

    return libraryDom;
  },
});
