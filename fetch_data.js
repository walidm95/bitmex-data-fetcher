const axios = require("axios");
const async = require("async");
const fs = require("fs");
const { Parser } = require("json2csv");
const path = require('path');

const base = "https://www.bitmex.com/api/v1/"

function getFundingRates(ticker, startDate, endDate)
{
    // example: https://www.bitmex.com/api/v1/funding?symbol=xbt&count=500&reverse=false&startTime=2015-09-01T00:00:00.000Z&endTime=2021-02-22T10:00:00.000Z

    // Calculate batches
    let batchSize = 500;
    let timestep = 8 * 60 * 60; // every 8h
    let batchSizeMs = timestep * batchSize * 1000;
    let nbrOfBatches = Math.ceil((new Date(endDate) - new Date(startDate)) / batchSizeMs) + 1;
    let currentBatch = 0;
    let currentDate = startDate;
    let rates = [];

    async.whilst(
        function test(cb) {
            cb(null, currentBatch < nbrOfBatches);
        },
        function iter(callback) {
            let nextDate = new Date(new Date(currentDate).getTime() + batchSizeMs).toISOString();
            let url = base + "funding?symbol=" + ticker + "&count=500&reverse=false&startTime=" + currentDate + "&endTime=" + nextDate;

            axios.get(url)
                .then((response) => {
                    rates = rates.concat(response.data);
                    currentBatch++;
                    currentDate = nextDate;
                    console.log("Batch " + currentBatch + " of " + nbrOfBatches);
                    callback(null, rates);
                }, (error) => {
                    console.log(error);
                })
        },
        function end(err, _rates) {
            if(err) {
                console.log(err);
            } else 
            if(!_rates) {
                console.log("Rates array is undefined");
            } else {
                // Save rates as CSV
                if (_rates.length > 0) {
                    exportCsv(ticker + "_rates", _rates);
                    console.log("Saved to CSV");
                } else {
                    console.log("No data found");
                }
            }
        }
    )
}

function getFuturesPrices(ticker, timeframe)
{
    let {startDate, endDate} = getQuarterlyDates(ticker);
    getPrices(ticker, timeframe, startDate, endDate);
}

function getPrices(ticker, timeframe, startDate, endDate)
{
    //note for quarterly month codes: H = march, M = June, U = Sept, Z = Dec
    //example: https://www.bitmex.com/api/v1/trade/bucketed?binSize=1h&partial=false&symbol=XBTH20&count=100&reverse=false

    
    // Calculate batches
    let batchSize = 1000;
    let timestep = getSecondsFromTimeframe(timeframe);
    let batchSizeMs = timestep * batchSize * 1000;
    let nbrOfBatches = Math.ceil((new Date(endDate) - new Date(startDate)) / batchSizeMs) + 1;
    let currentBatch = 0;
    let currentDate = startDate;
    let prices = [];

    async.whilst(
        function test(cb) {
            cb(null, currentBatch < nbrOfBatches);
        },
        function iter(callback) {
            let nextDate = new Date(new Date(currentDate).getTime() + batchSizeMs).toISOString();
            let url = base + "trade/bucketed?binSize=" + timeframe + "&partial=false&symbol=" + ticker + "&count=1000&reverse=false&startTime=" + currentDate + "&endTime=" + nextDate;

            axios.get(url)
                .then((response) => {
                    prices = prices.concat(response.data);
                    currentBatch++;
                    currentDate = nextDate;
                    console.log("Batch " + currentBatch + " of " + nbrOfBatches);
                    callback(null, prices);
                }, (error) => {
                    console.log(error);
                })
        },
        function end(err, _prices) {
            if(err) {
                console.log(err);
            } else 
            if(!_prices) {
                console.log("Prices array is undefined");
            } else {
                // Save rates as CSV
                if (_prices.length > 0) {
                    exportCsv(ticker + "_" + timeframe + "_prices", _prices);
                    console.log("Saved to CSV");
                } else {
                    console.log("No data found");
                }
            }
        }
    )
}

function getSecondsFromTimeframe(timeframe)
{
    switch(timeframe) 
    {
        case "1m":
            return 60;
        case "5m":
            return 60 * 5;
        case "1h":
            return 60 * 60;
        case "1d":
            return 60 * 60 * 24;
        default:
            return -1;
    }
}

function getQuarterlyDates(ticker)
{
    let monthCode = ticker.slice(3,4);
    let startMonth = "";
    let endMonth = "";
    let endYear = ticker.slice(4,6);
    let startYear = monthCode === "H" ? (endYear - 1).toString() : endYear;
    let endDay = "31";
    
    switch(monthCode)
    {
        case "H":
            startMonth = "09";
            endMonth = "04";
            break;
        case "M":
            startMonth = "01";
            endMonth = "07";
            endDay = "30";
            break;
        case "U":
            startMonth = "03";
            endMonth = "10";
            endDay = "30";
            break;
        case "Z":
            startMonth = "06";
            endMonth = "12";
            break;
    }

    

    let startDate = "20" + startYear + "-" + startMonth + "-01T00:00:00.000Z";
    let endDate = "20" + endYear + "-" + endMonth + "-" + endDay + "T23:59:59.000Z";

    return {startDate, endDate};
}

function exportCsv(filename, data) {
    const filepath = path.join(__dirname, filename + ".csv");
    const parser = new Parser();
    const csv = parser.parse(data);
    fs.writeFileSync(filepath, csv);
}

// Main
let args = process.argv.slice(2);
switch (args[0]) {
    case "funding":
        getFundingRates(args[1], args[2], args[3]);
        break
    case "prices":
        getPrices(args[1], args[2], args[3], args[4]);
    case "futures":
        getFuturesPrices(args[1], args[2]);
}