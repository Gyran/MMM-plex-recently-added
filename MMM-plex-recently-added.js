
var NOTIFICATIONS = {
  CONFIG: 'CONFIG',
  DATA: 'DATA',
  ERROR: 'ERROR',
};

var DISPLAY_TYPES = {
  MIXED: 'mixed',
  SEPARATE: 'separate',
}

Module.register('MMM-plex-recently-added', {
  recentlyAdded: {},

  defaults: {
    updateInterval: 10 * 60 * 1000,
    types: ['movie', 'episode', 'season'],
    displayType: DISPLAY_TYPES.MIXED,
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
    var displayType = this.config.displayType;

    if (displayType === DISPLAY_TYPES.MIXED) {
      return this._getMixedDisplayDom();
    } else if (displayType === DISPLAY_TYPES.SEPARATE) {
      return this._getSeperateDisplayDom();
    }

    return this._getConfigErrorDom();
  },

  _getConfigErrorDom() {
    var wrapper = document.createElement('div');

    wrapper.innerText = 'Check MMM-plex-recently-added config';

    return wrapper;
  },

  _getMixedDisplayDom() {
    var self = this;
    var wrapper = document.createElement('div');

    // Merge all types to one
    var items
      = this.config.types.reduce(function (all, type) {
        var typeItems = self.recentlyAdded[type];
        if (Array.isArray(typeItems)) {
          return all.concat(typeItems);
        }

        return all;
      }, [])
      .sort(function (a, b) {
        return b.addedAt - a.addedAt;
      });

    recentlyAddedListDom = self._getRecentlyAddedListDom(items);
    wrapper.appendChild(recentlyAddedListDom);

    return wrapper;
  },

  _getSeperateDisplayDom() {
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
    if (item.type === 'episode' || item.type === 'season') {
		if (item.grandparentThumb){
		thumbKey = 'grandparentThumb';
		}
		else{
      thumbKey = 'parentThumb';
		}
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
	}
    if (type === 'season') {
	  this._appendMetadataField(metadataDom, item, 'parentTitle');
      var SeasonEpisodeDom = document.createElement('div');
      SeasonEpisodeDom.classList.add('SeasonEpisode');
      SeasonEpisodeDom.innerText = item.leafCount + ' Episodes';
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
