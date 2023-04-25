const http = require('node:http');
const NodeHelper = require('node_helper');
const Log = require('logger');

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
  EPISODE: 'episode',
  SEASON: 'season',
};

const PlexTypes = {
  [Types.MOVIE]: '1',
  [Types.EPISODE]: '2',
  [Types.SEASON]: '2',
};

const fetchData = (url) => {
  return new Promise((resolve, reject) => {
    http
      .get(
        url,
        {
          headers: {
            Accept: 'application/json',
          },
        },
        (res) => {
          let responseBody = '';

          res.on('data', (chunk) => {
            responseBody += chunk;
          });

          res.on('end', () => {
            const data = JSON.parse(responseBody);
            resolve(data);
          });
        },
      )
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

      // validate types
      for (const type of payload.types) {
        if (!Object.values(Types).includes(type)) {
          Log.error(`${this.name}: Invalid type '${type}' found`);
        }
      }

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
    if (plexType === undefined) {
      throw new Error(`Can not determine plex type for type '${type}'`);
    }

    const url = new URL(
      `http://${this.config.hostname}:${this.config.port}/hubs/home/recentlyAdded`,
    );
    url.searchParams.append('type', plexType);
    if (this.config.token) {
      url.searchParams.append('X-Plex-Token', this.config.token);
    }

    Log.info(`${this.name}: fetching ${url}`);

    try {
      const data = await fetchData(url);

      const now = new Date();
      let newerThanDate =
        this.config.newerThanDay > 0
          ? new Date(now.getTime() - this.config.newerThanDay * ONE_DAY_MS)
          : new Date(0);

      const items = data.MediaContainer.Metadata.filter(
        (item) => item.type === type,
      ).filter((item) => {
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
