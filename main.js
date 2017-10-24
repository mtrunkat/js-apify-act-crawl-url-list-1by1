const Apify = require('apify');
const request = require('request-promise');
const PromisePool = require('es6-promise-pool');
const _ = require('underscore');

const REQUEST_EXEC_INTERVAL_MILLIS = 5000;
const UPDATE_STATE_EVERY_MILLIS = 15000; // @TODO

/**
 * Initializes state.
 * If option input.urlListFile is used then requests and parses the list of urls.
 * Persists state at the state in key-value store.
 */
const initState = async () => {
    // Get input of your act
    const input = await Apify.getValue('INPUT');
    console.log('My input:');
    console.dir(input);

    if (!input.concurrency) throw new Error('Parameter input.concurrency is required.');
    if (!input.crawlerId) throw new Error('Parameter input.crawlerId is required.');

    // Parse list of urls.
    let urlList = [];
    if (input.urlList) urlList = input.urlList;
    else if (input.urlListFile) urlList = (await request(input.urlListFile)).split('\n').filter(row => !!row);
    else throw new Error('You have to provide list of urls as file url or array in either input.urlListFile or input.urlList');
    if (!urlList.length) throw new Error('No urls provided!');
    console.log(`Going to crawler ${urlList.length} urls`);

    position = 0;

    await Apify.setValue('position', position);
    await Apify.setValue('urlList', urlList);

    return { position, urlList, input };
};

/**
 * Loads state from key-value store.
 */
const getState = async () => {
    const position = await Apify.getValue('position');

    if (!position) return false;

    const urlList = await Apify.getValue('urlList');
    const input = await Apify.getValue('INPUT');

    return { position, urlList, input };
};

/**
 * Waits until the given act execution gets finished and then returns it.
 */
const waitForFinish = async (actExecution) => {
    const updatedActExecution = await Apify.client.crawlers.getExecutionDetails({
        executionId: actExecution._id,
    });

    return updatedActExecution.status === 'RUNNING'
        ? waitForFinish(updatedActExecution)
        : updatedActExecution;
};

/**
 * Starts crawler and waits until it's finished.
 */
const runCrawler = async (crawlerId, url, crawlerSettings) => {
    const settings = _.isObject(crawlerSettings) ? crawlerSettings : {};
    settings.startUrls = [{ key: 'start', value: url }];

    const actExecution = await Apify.client.crawlers.startExecution({
        crawlerId,
        settings,
    });

    return waitForFinish(actExecution);
};

Apify.main(async () => {
    let { position, urlList, input } = (await getState()) || (await initState());

    console.log('Starting with state:');
    console.log({ position, 'urlList.length': urlList.length, input });

    // Persists position every UPDATE_STATE_EVERY_MILLIS milliseconds.
    const updateStateInterval = setInterval(() => {
        Apify.setValue('position', position);
        console.log('Postion persisted.');
    }, UPDATE_STATE_EVERY_MILLIS);


    console.log('Starting pool...');
    const promiseProducer = () => {
        if (position >= urlList.length) return;

        const promise = runCrawler(input.crawlerId, urlList[position], input.crawlerSettings);

        position ++;
        console.log(`Position: ${position}`);

        return promise;
    };
    const pool = new PromisePool(promiseProducer, input.concurrency)
    await pool.start();
    console.log('Pool finished.');

    clearInterval(updateStateInterval);
});
