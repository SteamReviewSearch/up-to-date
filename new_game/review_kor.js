var _ = require("lodash");
const client = require("../ELK_connection");
const https = require("https");
const axios = require("axios");
// const { Reviews, Games } = require("./models");
//데이터베이스 접속 변수
//작동코드

module.exports = class GetKor {

  setTimeoutPromise = (ms) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(), ms);
    });
  }
  count = async (n) => {
    let count = await client.count({
      index: "reviews_data",
      body: {
        query: {
          bool: {
            "filter": [
              {
                "term": {
                  "appid": n,
                }
              },
              {
                "term": {
                  "language": "koreana"
                }
              }
            ]
          }
        },
      },
    })
    return count.count;
  }

  getESList = async ({ appid, size }) => {
    let appid_review_list = await client.search({
      index: "reviews_data",
      body: {
        query: {
          bool: {
            "filter": [
              {
                "term": {
                  "appid": appid,
                }
              },
              {
                "term": {
                  "language": "koreana"
                }
              }

            ]
          }
        },
        "size": size
      },
    });
    return appid_review_list
  }


  work = async (n, index) => {
    await this.setTimeoutPromise(1000)
    //반복문을 동기처리 및 실패시 재접속을 위한 함수화
    console.log(`
| ${index}-kor  
| [${n}]`);
    await axios
      .get(
        `http://store.steampowered.com/appreviews/${n}?json=1&l=korean&filter=recent&num_per_page=100`,
        {
          contentType: "utf-8",
          // method: "GET",
          // uri: uri,
        },
        {
          baseURL: `http://store.steampowered.com/appreviews/${n}?json=1&l=korean&filter=recent&num_per_page=100`,
          timeout: 60000, //optional
          httpsAgent: new https.Agent({ keepAlive: true }),
          headers: { "Content-Type": "application/xml" },
        }
      )
      .then(async (response, next) => {
        if (response !== undefined) {
          if (!response?.body?.slice(0, 6).includes("<")) {
            const res = response.data;
            if (res.success) {
              if (res.query_summary?.num_reviews === 0) {
                return;
              } else {
                let sort_reviews = await res.reviews.sort((a, b) => {
                  return a.recommendationid - b.recommendationid;
                })
                let size = await this.count(n)
                let es_review_list = (await this.getESList({ appid: n, size: size })).hits.hits;
                let sort_es_reviews = []
                if (es_review_list.length !== 0) {
                  sort_es_reviews = es_review_list.map(ele => ele = ele._source.recommendationid).sort((a, b) => {
                    return a - b;
                  })
                }
                let check_num = 0;
                let result_list = [];
                for (let j of sort_reviews) {
                  if (sort_es_reviews.length !== 0) {
                    while (j.recommendationid > sort_es_reviews[check_num]) {
                      check_num++;
                    }
                    if (j.recommendationid == sort_es_reviews[check_num]) {
                      continue;
                    }
                  }
                  let ele = {
                    id: j.recommendationid,
                    appid: n,
                    recommendationid: j.recommendationid,
                    steamid: j.author.steamid,
                    playtime_at_review: j.author.playtime_at_review,
                    language: j.language,
                    review: j.review,
                    date_updated: new Date(j.timestamp_updated),
                    timestamp_updated: j.timestamp_updated,
                    voted_up: j.voted_up,
                    votes_up: j.votes_up,
                    votes_funny: j.votes_funny,
                    weighted_vote_score: j.weighted_vote_score,
                  }
                  result_list.push(ele)
                }
                if (result_list.length !== 0) {
                  let operations = result_list.flatMap(doc => [{ index: { _index: 'reviews_data' } }, doc])
                  const bulkResponse = await client.bulk({ refresh: true, operations })
                }

                await client.update({
                  index: "games_data",
                  refresh: true,
                  id: n,
                  body: {
                    doc: {
                      num_reviews: res.query_summary.num_reviews,
                      review_score: res.query_summary.review_score,
                      review_score_desc: res.query_summary.review_score_desc,
                      total_positive: res.query_summary.total_positive,
                      total_negative: res.query_summary.total_negative,
                      total_reviews: res.query_summary.total_reviews,
                    },
                  },
                });
              }
            }
          }
        }
      })
      .catch(async (error) => {
        console.log("멈춤 => " + error);
        console.log(error.stack)
        await this.setTimeoutPromise(6000);
        await this.work(n, index);
      });
  }
};