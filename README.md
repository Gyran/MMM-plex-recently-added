# MMM-plex-recently-added

Shows posters of the recently added items for your Plex Media Server.

## Installation

- Clone this repo
- run `npm install` in the cloned folder
- Get your plex token (https://support.plex.tv/hc/en-us/articles/204059436-Finding-your-account-token-X-Plex-Token)
- Add module to configuration:

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

| **Option**               | **Default**       | **Description**                                                                                                |
| ------------------------ | ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `hostname`               | `127.0.0.1`       | Hostname of the Plex Media Server.                                                                             |
| `port`                   | `32400`           | Port for your Plex Media Server.                                                                               |
| `token`                  |                   | Required if your Plex Media Server is protected                                                                |
| `types`                  | `['movie', 'tv']` | Which types of recently added medias should be shown and in which order. Possible values are `movie` and `tv`. |
| `limit`                  | `20`              | Maximum number of items to show. (this is mostly to not receive to many items from the server)                 |
| `newerThanDay`           | `0`               | How old an item can be in days. `0` shows all and `30` items less than 30 days old                             |
| `updateIntervalInMinute` | `60`              | Interval new data should be fetched in minutes.                                                                |
| `displayType`            | `mixed`           | If item types should be mixed or put in separate lists. Possible values are `mixed` and `separate`             |
| `displayTimeAgo`         | `false`           | To show `xx days ago` under the poster                                                                         |
