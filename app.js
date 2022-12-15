const schedule = require("node-schedule");

const j = schedule.scheduleJob("0 0 4 * * 4", async () => {
  await require("./ES_data_update/redis.js");
  await require("./ES_data_update/redis_appid.js");
  await require("./ES_data_update/redis_auto.js");
});
