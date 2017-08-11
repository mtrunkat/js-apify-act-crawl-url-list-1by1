# Crawl url list 1 by 1

Apify.com act that takes a list of urls and starts given crawler for each of the urls.

Crawler is published at Apify.com as **mtrunkat/crawl-url-list-1by1**.

You can start this act via POST request to following url with it's input as JSON payload:

https://api.apifier.com/v2/acts/mtrunkat~crawl-url-list-1by1?token=[YOUR_API_TOKEN]

### Example input:

You can either send url of publicly hosted file containing your url list (one url per line):

```json
{
    "urlListFile": "http://example.com/urllist.txt",
    "crawlerId": "ytXL3jaRKwrfWC9tz",
    "concurrency": 2
}
```

Or you can pass urls directly:

```json
{
    "urlList": ["http://example.com", "http://google.com"],
    "crawlerId": "ytXL3jaRKwrfWC9tz",
    "concurrency": 2
}
```

### Possible options:

Options **crawlerId**, **cocurrency** and one of **urlListFile** and **urlList** are required!

|Option|Type|Description|
-------|----|-----------|
|urlListFile|String|Url of the texfile containing urls to be crawled with one url per line|
|urlList|Array|Array of urls to be crawled.|
|crawlerId|String|Crawler ID.|
|concurrency|Number|Concurrency of crawler executions.|
|crawlerSettings|Object|Overrides of crawler settings passed to startExecution call|


