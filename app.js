// const index_game = require("./ES_data_update/index_game.js");
// const index_english = require("./ES_data_update/index_english.js");
// const index_kor = require("./ES_data_update/index_kor.js");

// var async = require("async");
// async.waterfall([index_game, index_english, index_kor], (err) => {
//     if (err) {
//       console.error(err);
//       return;
//     }
//   });

// let upToDate = async function () {
//   await require("./ES_data_update/index_game.js");
//   await require("./ES_data_update/index_english.js");
//   await require("./ES_data_update/index_kor.js");
// };

// const schedule = require("node-schedule");

// const j = schedule.scheduleJob("0 0 4 * * 4", async () => {
//   await require("./ES_data_update/index_game.js");
//   await require("./ES_data_update/index_english.js");
//   await require("./ES_data_update/index_kor.js");
// });
function setTimeoutPromise(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}
let ha = async () => {
  require("./ES_data_update/index_game.js");
  // await setTimeoutPromise(1000)
  // require("./ES_data_update/index_english.js");
  // await setTimeoutPromise(1000)
  // require("./ES_data_update/index_kor.js");
};
ha();
