const Notifications = {
  CONFIG: 'CONFIG',
  DATA: 'DATA',
  ERROR: 'ERROR',
};

const DisplayTypes = {
  MIXED: 'mixed',
  SEPARATE: 'separate',
};

// "dumb" function that just adds an 's'
// if interval is not 1 when floored.
// Simplify pluralizing time since etc. "month" "months"
const pluralizeInterval = (interval, word) => {
  const floored = Math.floor(interval);

  return `${floored} ${word}${floored !== 1 ? 's' : ''}`;
};

Module.register('MMM-plex-recently-added', {
  recentlyAdded: {},

  defaults: {
    updateIntervalInMinute: 60,
    types: ['movie', 'episode', 'season'],
    displayTimeAgo: false,
    displayType: DisplayTypes.MIXED,
    limit: 20,
    token: '',
    newerThanDay: 0,
    hostname: '127.0.0.1',
    port: '32400',
  },

  start: function () {
    Log.info(`Starting module: ${this.name}`);
    this.sendSocketNotification('CONFIG', this.config);
  },

  socketNotificationReceived: function (notification, payload) {
    Log.info(`${this.name}: socketNotificationReceived`);
    if (notification === Notifications.DATA) {
      this.recentlyAdded[payload.type] = payload.items;
      this.updateDom();
    } else if (notification === Notifications.ERROR) {
      Log.error(`${this.name}:`, payload.error);
    }
  },

  getStyles: function () {
    return ['MMM-plex-recently-added.css'];
  },

  getDom() {
    const displayType = this.config.displayType;

    if (Object.keys(this.recentlyAdded).length) {
      if (displayType === DisplayTypes.MIXED) {
        return this.getMixedDisplayDom();
      }

      if (displayType === DisplayTypes.SEPARATE) {
        return this.getSeperateDisplayDom();
      }
    }

    return this.getMessageDom('loading...');
  },

  getMessageDom(message) {
    const wrapper = document.createElement('div');
    wrapper.innerText = `${this.name}: ${message}`;

    return wrapper;
  },

  async getMixedDisplayDom() {
    const types = this.config.types;
    const wrapper = document.createElement('div');

    // Merge all types to one
    const items = [];
    for (const type in types) {
      const tmp = this.recentlyAdded[types[type]];
      if (tmp && tmp.length) {
        items.push(...tmp);
      }
    }

    items.sort(function (a, b) {
      return b.addedAt - a.addedAt;
    });

    const recentlyAddedListDom = this.getRecentlyAddedListDom(items);
    if (recentlyAddedListDom) {
      wrapper.appendChild(recentlyAddedListDom);
    }

    return wrapper;
  },

  getSeperateDisplayDom() {
    const types = this.config.types;
    const wrapper = document.createElement('div');

    for (const type in types) {
      const items = this.recentlyAdded[types[type]];
      const recentlyAddedListDom = this.getRecentlyAddedListDom(items);
      if (recentlyAddedListDom) {
        wrapper.appendChild(recentlyAddedListDom);
      }
    }

    return wrapper;
  },

  getThumbUrl(item) {
    let key = 'thumb';
    if (item.type === 'episode' || item.type === 'season') {
      key = 'parentThumb';
      if (item.grandparentThumb) {
        key = 'grandparentThumb';
      }
    }

    const url = new URL(
      `http://${this.config.hostname}:${this.config.port}${item[key]}`,
    );
    if (this.config.token) {
      url.searchParams.append('X-Plex-Token', this.config.token);
    }
    return url.href;
  },

  appendMetadataField(element, item, field) {
    let fieldValue = item[field];
    if (fieldValue) {
      if (field === 'addedAt') {
        fieldValue = `${this.timeSince(new Date(fieldValue * 1000))} ago`;
      }
      const div = document.createElement('div');
      div.classList.add(field);
      div.innerText = fieldValue;
      element.appendChild(div);
    }
  },

  timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;

    if (interval > 1) {
      return pluralizeInterval(interval, 'year');
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return pluralizeInterval(interval, 'month');
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return pluralizeInterval(interval, 'day');
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return pluralizeInterval(interval, 'hour');
    }
    interval = seconds / 60;
    if (interval > 1) {
      return pluralizeInterval(interval, 'minute');
    }
    return pluralizeInterval(interval, 'second');
  },

  getMetadataDom(item) {
    const type = item.type;

    const metadataDom = document.createElement('div');
    metadataDom.classList.add('metadata');
    metadataDom.classList.add(type);

    if (type === 'episode') {
      this.appendMetadataField(metadataDom, item, 'grandparentTitle');
      this.appendMetadataField(metadataDom, item, 'title');
      if (this.config.displayTimeAgo) {
        this.appendMetadataField(metadataDom, item, 'addedAt');
      }
      const SeasonEpisodeDom = document.createElement('div');
      SeasonEpisodeDom.classList.add('SeasonEpisode');
      SeasonEpisodeDom.innerText = `S${item.parentIndex}E${item.index}`;
      metadataDom.appendChild(SeasonEpisodeDom);
      return metadataDom;
    }

    if (type === 'season') {
      this.appendMetadataField(metadataDom, item, 'parentTitle');
      if (this.config.displayTimeAgo) {
        this.appendMetadataField(metadataDom, item, 'addedAt');
      }
      this.appendMetadataField(metadataDom, item, 'title');
      const SeasonEpisodeDom = document.createElement('div');
      SeasonEpisodeDom.classList.add('SeasonEpisode');
      SeasonEpisodeDom.innerText = `${item.leafCount} Episodes`;
      metadataDom.appendChild(SeasonEpisodeDom);

      return metadataDom;
    }

    this.appendMetadataField(metadataDom, item, 'title');
    if (this.config.displayTimeAgo) {
      this.appendMetadataField(metadataDom, item, 'addedAt');
    }
    this.appendMetadataField(metadataDom, item, 'year');

    return metadataDom;
  },

  getItemDom(item) {
    const itemDom = document.createElement('li');
    itemDom.classList.add('item');

    const posterDom = document.createElement('div');
    posterDom.classList.add('poster');

    const thumbUrl = this.getThumbUrl(item);
    posterDom.style.backgroundImage = `url(${thumbUrl})`;

    posterDom.style.backgroundSize = 'cover';
    itemDom.appendChild(posterDom);

    const metadataDom = this.getMetadataDom(item);
    if (metadataDom) {
      itemDom.appendChild(metadataDom);
    }
    return itemDom;
  },

  getRecentlyAddedListDom(items) {
    if (!items || !items.length) {
      return null;
    }

    const libraryDom = document.createElement('ul');
    libraryDom.classList.add('recentlyAddedList');

    const self = this;
    items.forEach(function (item) {
      const itemDom = self.getItemDom(item);

      libraryDom.appendChild(itemDom);
    });

    return libraryDom;
  },
});
