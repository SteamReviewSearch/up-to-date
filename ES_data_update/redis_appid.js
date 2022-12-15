const redisClient = require("../redis_connection");
const client = require("../ELK_connection");

async function b() {
  let a = await redisClient.hKeys("appid");
  const index = { index: process.env.REVIEW };
  let query = [];
  let game = [];
  try {
    for (let i = 0; i < a.length; i++) {
      appid = await a[i].split("+")[0];
      slice_start = await a[i].split("+")[1];
      filter = await a[i].split("+")[2];
      filterExists = await a[i].split("+")[3];
      sort = [{ weighted_vote_score: "desc" }];

      const game_option = {
        index: process.env.GAME,
        id: appid,
      };
      const game_doc = await client.get(game_option);
      game.push(game_doc);

      const review_option = {
        from: slice_start,
        size: 30,
        sort,
        query: {
          bool: {
            must: [{ match: { appid } }],
          },
        },
      };
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
        review_option.query.bool["filter"] = array;
      }
      query.push(index);
      query.push(review_option);
    } //for 문 끝
    const review_list = await client.msearch({ body: query });
    console.log(review_list.responses[0].hits.hits);
    for (let i = 0; i < review_list.responses.length; i++) {
      await redisClient.hSet(
        "appid",
        a[i],
        JSON.stringify({
          game_doc: game[i]._source,
          data: review_list.responses[i].hits.hits,
        })
      );
    }
  } catch (error) {
    throw error;
  }
}
b();
