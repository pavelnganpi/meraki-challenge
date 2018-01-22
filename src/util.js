const Sequelize = require('sequelize');
const axios = require('axios');
const host = 'http://13.57.238.59';

// sqlite DB connection instance
const sequelize = new Sequelize({
  dialect: 'sqlite',
  pool: {
    max: 30,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  storage: 'home/demo/usage_data.sqlite3',
  logging: false,
});
// Users/paveynganpi/usage_data.sqlite3
// defines sqlite table
const UsageData = sequelize.define('usage_data', {
  node_id: Sequelize.INTEGER,
  timestamp: Sequelize.REAL, // couldn't use REAL since Sequelize only supports REAL data type for postgressql
  kb: Sequelize.INTEGER,
});

// saves grabbed bulk data to sqlite
const saveData = (data) => {
  sequelize.sync()
    .then(() => UsageData.bulkCreate(data))
    .then(() => {
      console.log("success saving %s nodes data", data.length);
    })
    .catch(error => {
      console.log("error saving data ", error);
      throw error;
    });
}

// performs get request to grab data for node with nodeId
const grabData = async (nodeId) => {
  const result = await axios.get(`${host}/nodes/${nodeId}/usage`, {'timeout': 4000})
    .then(response => {
      return response.data.split(',');
    })
    .catch(error => {
      console.log("Error fetching data for node_id ", nodeId, error.message);
      return []; // to able to avoid it from poisoning our data processing
    });
    return result;
}

// initializes nodeIds array
const initNodeIds = (maxId) => {
  const nodeIds = [];
  for(let i = 1; i <= maxId; i++) {
    nodeIds.push(i);
  }
  return nodeIds;
}

export {
  UsageData,
  saveData,
  grabData,
  initNodeIds,
}
