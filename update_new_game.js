const client = require("./ELK_connection")
var request = require("sync-request");
let updateNameEng = async (offset, start) => {
  let res = await request(
    "Get", "https://api.steampowered.com/ISteamApps/GetAppList/v2"
  );
  if (res.getBody("utf8") !== undefined) {
    const response = JSON.parse(res.getBody("utf8"));
    if (res.getBody("utf8").slice(0, 6) !== "<HTML>") {
      let apps = response.applist.apps;

      let index = -1;
      let count = 0
      for (let i = 0; i < apps.length / 100; i++) {
        // 100씩 끊기

        await setTimeoutPromise(1000)
        index++
        let list = apps.slice(i, i + 100);

        // appid만 담기(_search용)
        let appid_list = [];

        for (let j = 0; j < list.length; j++) {
          appid_list.push(list[j].appid)
        }
        // appid 묶음 검색하기 (_id 찾는용도)
        const games = await client.search({
          index: "games_data",
          size: 100,
          _source: ["appid"],
          query: {
            bool: {
              filter: [
                {
                  terms: {
                    appid: appid_list
                  }
                },
                {
                  exists: {
                    field: "name"
                  }
                }
              ]
            }
          }
        })
      }
    }
  };
}


function setTimeoutPromise(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}
updateNameEng()

count += games.hits.hits.length
// bulk용 request 쿼리 만들어주기
let req_list = []

for (let k = 0; k < games.hits.hits.length; k++) {

  for (let j = 0; j < list.length; j++) {

    if (list[j].appid == games.hits.hits[k]._source.appid) {
      const update_request = { "update": { "_id": games.hits.hits[k]._id, "_index": "games_data" } }
      const update_doc = { "doc": { "name_eng": list[j].name } }
      req_list.push(update_request, update_doc)
    }
  }
}
// bulk 요청하기
const result = await client.bulk({
  body: req_list
})
console.log("index: " + index + " / " + "took: " + result.took + " / " + "errors: " + result.errors + ' / ' + 'count: ' + count)
// console.log(result.items)