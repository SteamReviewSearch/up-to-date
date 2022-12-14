const redisClient = require("../redis_connection");
const client = require("../ELK_connection");

async function b() {
  let a = await redisClient.hKeys("appid");
  for (let i = 0; i < a.length; i++) {
    appid = await a[i].split("+")[0];
    slice_start = await a[i].split("+")[1];
    filter = await a[i].split("+")[2];
    filterExists = await a[i].split("+")[3];
    sort = [{ weighted_vote_score: "desc" }];
    try {
      const game_option = {
        index: process.env.GAME,
        id: appid,
      };
      const game_doc = await client.get(game_option);
      const review_option = {
        from: slice_start,
        size: 30,
        index: process.env.REVIEW,
        body: {
          sort,
          query: {
            bool: {
              must: [{ match: { appid } }],
            },
          },
        },
      };
      // console.log(review_option.body.sort)
      // 필터 넣어주기
      if (filterExists) {
        console.log("존재한다고?");
        let array = [];
        for (let key in filter) {
          // key 는 []로 감싸야 한다.
          if (filter[key] !== "none") {
            let obj1 = {};
            let obj2 = {};
            obj2[key] = filter[key];
            obj1["match"] = obj2;
            array.push(obj1);
          }
        }
        review_option.body.query.bool["filter"] = array;
      }

      const review_list = await client.search(review_option);
      console.log(review_list.hits);
      await redisClient.hSet(
        "appid",
        a[i],
        JSON.stringify({
          game_doc: game_doc._source,
          data: review_list.hits.hits,
        })
      );
    } catch (error) {
      throw error;
    }
    console.log(a[i]);
  }
  const g = await redisClient.hGetAll("appid");
  console.log(g);
}
b();
