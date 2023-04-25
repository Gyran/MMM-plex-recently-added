const http = require('http')
const NodeHelper = require('node_helper')
const Log = require('logger')
const { XMLParser } = require('fast-xml-parser')

const TEN_MINUTES = 10 * 60 * 1000

const Notifications = {
  CONFIG: 'CONFIG',
  DATA: 'DATA',
  ERROR: 'ERROR'
}

const Types = {
  MOVIE: 'movie',
  TV: 'tv'
}

const PlexTypes = {
  [Types.MOVIE]: '1',
  [Types.TV]: '2'
}

const fetchData = (url, data) => {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let responseBody = ''

      res.on('data', (chunk) => {
        responseBody += chunk
      })

      res.on('end', () => {
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: ''
        })
        resolve(parser.parse(responseBody, 'text/xml'))
      })
    }).on('error', (err) => {
      reject(err)
    })
  })
}

module.exports = NodeHelper.create({
  config: {},

  updateTimer: null,

  // Override start method.
  start: function () {
    Log.log(`Starting node helper for: ${this.name}`)
  },

  async socketNotificationReceived (notification, payload) {
    if (notification === Notifications.CONFIG && !this.client) {
      this.config = payload
      Log.info(`${this.name}: socketNotificationReceived`)

      // Process fetch for the first time
      this.process()
    }
  },

  scheduleNextFetch (delayMs) {
    clearTimeout(this.updateTimer)

    this.updateTimer = setTimeout(() => {
      this.process()
    }, Math.max(delayMs, TEN_MINUTES))
  },

  process () {
    // Fetch data for each types regardless if we need it or not
    for (const type in Types) {
      this.fetchFromPlex(Types[type])
    }

    // schedule the next fetch
    this.scheduleNextFetch(this.config.updateIntervalInMinute * 60 * 1000)
  },

  async fetchFromPlex (type) {
    const plexType = PlexTypes[type]
    const url = new URL(`http://${this.config.hostname}:${this.config.port}/hubs/home/recentlyAdded?type=${plexType}`)
    if (this.config.token) {
      url.searchParams.append('X-Plex-Token', this.config.token)
    }

    Log.info(`${this.name}: fetching ${url}`)

    try {
      const data = await fetchData(url)
      if (!data || !data.MediaContainer || !data.MediaContainer.Video || !data.MediaContainer.Video.length) {
        throw new Error(`No items found for ${type}, check Plex Token`)
      }

      const items = []
      let i = 0
      const { limit } = this.config

      for await (const item of data.MediaContainer.Video) {
        if (i >= limit) {
          break
        }

        // skip records if too old and setting is enabled
        if (this.config.newerThanDay) {
          const isOlderThanDay = (() => {
            const now = new Date()
            const pastDate = new Date(now.getTime() - (this.config.newerThanDay * 24 * 60 * 60 * 1000))
            const itemAddedDate = item.addedAt * 1000
            return itemAddedDate <= pastDate.getTime()
          })()

          if (isOlderThanDay) {
            continue
          }
        }

        items.push({
          title: item.title,
          parentTitle: item.parentTitle,
          grandparentTitle: item.grandparentTitle,
          index: item.index,
          parentIndex: item.parentIndex,
          year: item.year,
          type: item.type,
          thumb: item.thumb,
          grandparentThumb: item.grandparentThumb,
          parentThumb: item.parentThumb,
          addedAt: item.addedAt,
          originallyAvailableAt: item.originallyAvailableAt
        })
        i++
      }

      Log.info(`${this.name}: found ${items.length} items`)
      this.sendSocketNotification(Notifications.DATA, { type, items })
    } catch (error) {
      Log.error(error)
      this.sendSocketNotification(Notifications.ERROR, { error: error.message })
    }
  }
})
