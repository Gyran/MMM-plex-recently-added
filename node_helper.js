const http = require('node:http');
const NodeHelper = require('node_helper');
const Log = require('logger');
const { XMLParser } = require('fast-xml-parser');

const ONE_MINUTE_MS = 60 * 1000;
const TEN_MINUTES_MS = 10 * ONE_MINUTE_MS;
const ONE_DAY_MS = 1 * 24 * 60 * ONE_MINUTE_MS;

const Notifications = {
  CONFIG: 'CONFIG',
  DATA: 'DATA',
  ERROR: 'ERROR',
};

const Types = {
  MOVIE: 'movie',
  TV: 'tv',
};

const PlexTypes = {
  [Types.MOVIE]: '1',
  [Types.TV]: '2',
};

const fetchData = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    http
      .get(url, options, (res) => {
        let responseBody = '';

        res.on('data', (chunk) => {
          responseBody += chunk;
        });

        res.on('end', () => {
          const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '',
          });
          resolve(parser.parse(responseBody, 'text/xml'));
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

module.exports = NodeHelper.create({
  config: {},

  updateTimer: null,

  // Override start method.
  start: function () {
    Log.log(`Starting node helper for: ${this.name}`);
  },

  async socketNotificationReceived(notification, payload) {
    Log.info(`${this.name}: socketNotificationReceived ${notification}`);
    if (notification === Notifications.CONFIG && !this.client) {
      this.config = payload;

      // Process fetch for the first time
      this.process();
    }
  },

  scheduleNextFetch(delayMs) {
    clearTimeout(this.updateTimer);

    this.updateTimer = setTimeout(() => {
      this.process();
    }, Math.max(delayMs, TEN_MINUTES_MS));
  },

  process() {
    for (const type of this.config.types) {
      this.fetchFromPlex(type);
    }

    // schedule the next fetch
    this.scheduleNextFetch(this.config.updateIntervalInMinute * ONE_MINUTE_MS);
  },

  async fetchFromPlex(type) {
    const plexType = PlexTypes[type];
    const url = new URL(
      `http://${this.config.hostname}:${this.config.port}/hubs/home/recentlyAdded`,
    );
    url.searchParams.append('type', plexType);
    if (this.config.token) {
      url.searchParams.append('X-Plex-Token', this.config.token);
    }

    Log.info(`${this.name}: fetching ${url}`);

    try {
      const data = await fetchData(url, {
        headers: {
          'X-Plex-Container-Start': '0',
          'X-Plex-Container-Size': this.config.limit * 2, // fetch a few more so that we hopefully get enough
        },
      });
      if (
        !data ||
        !data.MediaContainer ||
        !data.MediaContainer.Video ||
        !data.MediaContainer.Video.length
      ) {
        throw new Error(`No items found for ${type}, check Plex Token`);
      }

      const now = new Date();
      let newerThanDate = new Date(
        now.getTime() - this.config.newerThanDay * ONE_DAY_MS,
      );

      const items = data.MediaContainer.Video.filter((item) => {
        const itemAddedDate = new Date(item.addedAt * 1000);

        return itemAddedDate >= newerThanDate;
      });

      Log.info(`${this.name}: found ${items.length} items for type ${type}`);
      this.sendSocketNotification(Notifications.DATA, {
        type,
        items: items.slice(0, this.config.limit),
      });
    } catch (error) {
      Log.error(error);
      this.sendSocketNotification(Notifications.ERROR, {
        error: error.message,
      });
    }
  },
});
