# MMM-plex-recently-added
Shows posters of the recently added items for your Plex Media Server.


## Installation
* Clone this repo
* run `npm install` in the cloned folder
* Get your plex token (https://support.plex.tv/hc/en-us/articles/204059436-Finding-your-account-token-X-Plex-Token)
* Add module to configuration:
```
{
     module: 'MMM-plex-recently-added',
     position: 'bottom_bar',
     config: {
        token: 'X-PLEX-TOKEN',
        hostname: '127.0.0.1',
        ...
     }
 }
```

## Config options
| **Option** | **Default** | **Description** |
| --- | --- | --- |
| `hostname` | `127.0.0.1` | Hostname of the Plex Media Server. |
| `port` | `32400` | Port for your Plex Media Server. |
| `token` |  | Required if your Plex Media Server is protected |
| `types` | `['movie', 'episode']` | Which types of recently added medias should be shown and in which order. Possible values are `movie` and `episode`. |
| `limit` | `20` | Maximum number of items to show. (this is mostly to not receive to many items from the server) |
| `updateInterval` | `10 * 60 * 1000` (10 minutes) | Interval new data should be fetched. |
