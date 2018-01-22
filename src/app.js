import express from 'express';
import path from 'path';
import logger from 'morgan';
import { UsageData, saveData, grabData, initNodeIds } from './util'
const async = require('async');
const request = require('request');

const app = express();
app.disable('x-powered-by');
app.use(logger('dev', {
  skip: () => app.get('env') === 'test'
}));

const maxId = process.env.MAX_ID ? process.env.MAX_ID : 500;
const nodeIds = initNodeIds(maxId);

function processNodesData() {

  // iterates over nodeIds parallelly and grabs data for each node
  // then saves it to sqlite as a bulk.
  async.map(nodeIds, async (nodeId, callback) => {
    const hrstart = process.hrtime();
    const nodeData = await grabData(nodeId);
    const hrend = process.hrtime(hrstart);
    console.info("Execution time (hr): %ds %dms %s", hrend[0], hrend[1]/1000000, nodeId);

    // handles case where grabData returns an empty array due to an http error that occured
    // while fetching a particular node's data. If such a case happens, en empty object is
    // returned in callback function which is later treated.
    if (nodeData.length > 0) {
      const payload = {
        node_id: nodeData[0],
        timestamp: nodeData[1],
        kb: nodeData[2],
      };
      callback(null, payload);
    } else {
      console.log("error from http for nodeId $s", nodeId);
      callback(null, {});
    }

    // result param is an array which resulted from
    // accumulating the payloads of all nodes.
  }, (err, result) => {
    result = result.filter(x => Object.keys(x).length > 0); // filter any payloads that resulted with an error grabbing a node data
    if (err) {
      console.log("error with result ", err);
      throw err;
    }
    saveData(result);
  });
}

processNodesData();
setInterval(processNodesData, 5000);

// "ECONNRESET" means the other side of the TCP conversation abruptly closed its end of the connection.
export default app;
