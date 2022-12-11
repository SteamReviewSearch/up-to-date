const Worker = require("worker_threads");
var _ = require("lodash");
var request = require("sync-request");
const client = require("../ELK_connection");
const https = require("https");
const axios = require("axios");
const { updateErrorESLog } = require("../Log/logger")
// const { Reviews, Games } = require("./models");

module.exports = class GetEng {

  //데이터베이스 접속 변수
  //작동코드
  setTimeoutPromise = (ms) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(), ms);
    });
  }

  // 리뷰 중복체크
  check = async (recommendationid) => {
    const list = await client.search({
      index: "reviews_data",
      body: {
        query: {
          bool: {
            must: [{ match: { recommendationid: recommendationid } }],
          },
        },
      },
    });
    if (list.hits.hits.length) {
      await client.delete({
        index: "reviews_data",
        id: list.hits.hits[0]._id,
      });
    }
    return false;
  };
  // n = appid , index = 없어도 됨. 
  work = async (n, index, worker) => {
    //반복문을 동기처리 및 실패시 재접속을 위한 함수화
    console.log(`
${worker}| ${index}-eng  
${worker}| [${n}]`);

    //n:appid
    await this.setTimeoutPromise(1000);
    await axios
      .get(
        `http://store.steampowered.com/appreviews/${n}?json=1&l=english&filter=recent&num_per_page=100`,
        {
          contentType: "utf-8",
          // method: "GET",
          // uri: uri,
        },
        {
          baseURL: `http://store.steampowered.com/appreviews/${n}?json=1&l=english&filter=recent&num_per_page=100`,
          timeout: 60000, //optional
          httpsAgent: new https.Agent({ keepAlive: true }),
          headers: { "Content-Type": "application/xml" },
        }
      )
      .then(async (response, next) => {
        if (response !== undefined) {
          if (!response?.body?.slice(0, 6).includes("<")) {
            //access deined발생시 axios에러를 뱉어서 여기까지 안옴
            //response.body는 undefind로 나옴
            const res = response.data;

            // console.log(res.query_summary, n, "query summary");
            if (res.success) {
              //response.data는 jsonparse필요없음
              if (res.query_summary?.num_reviews === 0) {
                // console.log(res.query_summary.num_reviews, n);
                return;
              } else {
                // console.log(res.reviews, "reviews");
                for (let j of res.reviews) {
                  const reuslt_check = await this.check(j.recommendationid);
                  if (!reuslt_check) {
                    // false === 중복이 없는 경우 생성
                    await client.index({
                      index: "reviews_data",
                      refresh: true,
                      id: j.recommendationid,
                      body: {
                        // params: { retry_on_conflict: 6 },
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
                        playtime_forever: j.playtime_forever,
                        playtime_last_two_weeks: j.playtime_last_two_weeks,
                      },
                    });
                  } else {
                    // object === 중복 있는 경우 수정
                    // await client.update({
                    //   index: "reviews_data",
                    //   refresh: true,
                    //   id: reuslt_check._id, // 와 지렸다 진짜 지렸어여
                    //   body: {
                    //     // params: { retry_on_conflict: 6 },
                    //     doc: {
                    //       appid: n,
                    //       recommendationid: j.recommendationid,
                    //       steamid: j.author.steamid,
                    //       playtime_at_review: j.author.playtime_at_review,
                    //       language: j.language,
                    //       review: j.review,
                    //       timestamp_updated: j.timestamp_created,
                    //       voted_up: j.voted_up,
                    //       votes_up: j.votes_up,
                    //       votes_funny: j.votes_funny,
                    //       weighted_vote_score: j.weighted_vote_score,
                    //     },
                    //   },
                    // });
                    // console.log("업데이트", j.recommendationid);
                  } //일단 주석 다큐먼트아이디가 다 recommendationid가될때 풀듯 check부분도 수정필요
                }
                // 업데이트 유무 상관없이 크롤링한 평가 정보 games_data 에 업데이트
                await client.update({
                  index: "games_data",
                  refresh: true,
                  id: n,
                  body: {
                    // params: { retry_on_conflict: 6 },
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
        updateErrorESLog.error({ label: error.name, message: error.stack || 'null' })
        await this.setTimeoutPromise(6000);
        await work(n, index);
      });
  }

  // getReviewsEng = async () => {
  //   let num = Worker.threadId - 4;
  //   let { list, work_start } = await finAllList(num);
  //   //game테이블에서 리스트 구합니다.
  //   //배열을 2개씩 나눕니다.
  //   let index = 0;
  //   for (const i of list) {
  //     //두개씩있는 배열 반복
  //     index++;
  //     console.log("review_datas eng" + num + '번 일꾼 / ', "index : " + index, " / appid: " + i);
  //     await work(i, index);
  //     await setTimeoutPromise(1000);
  //   }
  // };

  // finAllList = async (num) => {
  //   // 갯수세는 것 뿐
  //   const count = await client.count({ index: "games_data_copy" });

  //   const work_start = Math.floor((count.count * (num - 1)) / 3);
  //   const work_end = Math.floor((count.count * num) / 3) - 1;
  //   console.log(`한국인 노동자 ${num}번 시작 ${work_start} ~ 끝 ${work_end}}`);
  //   let from = 6 * (num - 1);
  //   let term = Math.floor((work_end - work_start) / 6) - 1; //from과 size의 합이 10000이 넘으면 안된다고 해서
  //   console.log(term);
  //   let list = [];
  //   for (let i = from; i < from + 6; i++) {
  //     //게임 리스트
  //     let appids = await client.search({
  //       index: "games_data_copy",
  //       from: i, //모든 스레드
  //       size: term,
  //       _source: ["appid"],
  //       body: {
  //         query: {
  //           bool: {
  //             must_not: [{ match: { pass: false } }],
  //           },
  //         },
  //       },
  //     });
  //     const hits = appids.hits.hits;
  //     for (let j = 0; j < hits.length; j++) {
  //       list.push(hits[j]._source.appid);
  //       // list.push(appids.hits.hits);
  //       // console.log(list);
  //     }
  //   }
  //   console.log(list);
  //   return { list, work_start };
  // }; // ?


}

