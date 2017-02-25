var NodeHelper = require('node_helper');
var Plex = require('./plex');

var NOTIFICATIONS = {
  CONFIG: 'CONFIG',
  DATA: 'DATA',
  ERROR: 'ERROR',
};

module.exports = NodeHelper.create({
  socketNotificationReceived: function(notification, payload) {
    if (notification === NOTIFICATIONS.CONFIG) {
      this.config = payload;

      this.client = Plex({
        token: this.config.token,
        hostname: this.config.hostname,
        port: this.config.port,
      });

      this.update();
      setInterval(() => {
        this.update();
      }, this.config.updateInterval);
    }
  },

  update: function() {
    this.config.types.forEach((type) => {
      this.client.recentlyAdded(type, this.config.limit).then((items) => {
        this.sendSocketNotification(NOTIFICATIONS.DATA, {
          type: type,
          items: items,
        });
      }, (error) => {
        this.sendSocketNotification(NOTIFICATIONS.ERROR, { error });
      });
    });
  }
});
