const schedule = require("node-schedule");

const j = schedule.scheduleJob("0 0 4 * * 4", async () => {
  await require("./ES_data_update/index_game.js");
  await require("./ES_data_update/redis.js");
});
