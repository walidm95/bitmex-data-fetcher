# bitmex-data-fetcher
Download historical data from Btimex

Examples:
  - Download historical prices data:
      - node .\fetch_data.js "prices" "XBTUSD" "1h" "2015-09-01T00:00:00.000Z" "2021-02-22T00:00:00.000Z"
  - Download historical futures data:
      - node .\fetch_data.js "futures" "XBTH21" "1d"
      - Note: For month codes, H = march, M = june, U = september, Z = december
  - Download funding rates data:
      - node .\fetch_data.js "prices" "XBTUSD" "1h" "2015-09-01T00:00:00.000Z" "2021-02-22T00:00:00.000Z"
