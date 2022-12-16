// const redisClient = require("../redis_connection");
// const client = require("../ELK_connection");

// async function b() {
//   let a = await redisClient.hKeys("auto-complete");
//   for (let i = 0; i < a.length; i++) {
//     let { value } = a[i];
//     try {
//       let option_keywords = {
//         from: 0,
//         size: 5,
//         _source: ["appid", "name", "img_url"],
//         index: process.env.GAME,
//         body: {
//           query: {
//             bool: {
//               must: [
//                 {
//                   bool: {
//                     should: [
//                       {
//                         match: {
//                           "name.ngram_filter": {
//                             query: value,
//                             fuzziness: 2, // 오타 검색이 가능해짐
//                           },
//                         },
//                       },
//                       {
//                         match: {
//                           "name_eng.ngram_filter": {
//                             query: value,
//                             fuzziness: 2, // 오타 검색이 가능해짐
//                           },
//                         },
//                       },
//                     ],
//                   },
//                 },
//                 { exists: { field: "img_url" } },
//                 { exists: { field: "review_score_desc" } },
//               ],
//               should: [
//                 { prefix: { "name.standard": { value: value } } },
//                 { match: { "name.standard": value } }, // 노말 검색 up
//                 { match: { type: "game" } }, // type이 game이면 +
//               ],
//             },
//           },
//         },
//       };
//       const game_list = await client.search(option_keywords);
//       await redisClient.hSet(
//         "auto-complete",
//         a[i],
//         JSON.stringify(game_list.hits.hits)
//       );
//     } catch (error) {
//       console.log(error);
//     }
//   }
//   const g = await redisClient.hGetAll("auto-complete");
//   console.log(g);
// }
// b();
