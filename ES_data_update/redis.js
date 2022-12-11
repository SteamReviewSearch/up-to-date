const redisClient = require("../redis_connection");
const client = require("../ELK_connection");

async function a() {
  let a = await redisClient.hKeys("gamename");
  for (let i = 0; i < a.length; i++) {
    keywords = await a[i].split("+")[0];
    slice_start = await a[i].split("+")[1];
    try {
      let option_keywords = {
        from: slice_start,
        size: 30,
        index: "games_data",
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    "name.ngram_analyzer": {
                      query: keywords,
                      fuzziness: 2, // 오타 검색이 가능해짐
                    },
                  },
                },
                { exists: { field: "img_url" } },
                { exists: { field: "review_score_desc" } },
              ],
              should: [
                { match_phrase: { "name.standard": keywords } }, // 구문 검색 up
                // { match_phrase_prefix: { "name.standard": keywords } }, // 구문검색을 하지만 마지막 요소는 접두사
                { match: { "name.standard": keywords } }, // 노말 검색 up
                // { match: { "name.ngrams": keywords } }, // ngram 은 점수에는 아닌듯
                { match: { type: "game" } }, // type이 game이면 +
              ],
            },
          },
        },
      };
      const gamelist = await client.search(option_keywords);
      let list = gamelist.hits.hits;
      await redisClient.hSet("gamename", a[i], JSON.stringify({ data: list }));
      // console.log(game_list)
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  console.log(g);
}
a();
