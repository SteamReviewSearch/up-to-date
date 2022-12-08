const client = require("../ELK_connection");
const Worker = require("worker_threads");
// {
//   count: 150548,
//   _shards: { total: 1, successful: 1, skipped: 0, failed: 0 }
// }
// count.count === 150548
console.log(0, Math.floor((150548 * 1) / 10), Math.floor((150548 * 2) / 10));

// 0 50182 100365
// 150548
// let updateWithES = async () => {
//   try {
//     let num = Worker.threadId;
//     const count = await client.count({ index: "games_data" });

//     const work_start = Math.floor((count.count * (num - 1)) / 3);
//     const work_end = Math.floor((count.count * num) / 3) - 1;

//     console.log(`시작 ${work_start} / 끝 ${work_end}}`);

//     // console.log(`0 ~ ${Math.floor((count.count * 1) / 3) - 1}`);
//     // console.log(
//     //   `${Math.floor((count.count * 1) / 3)} ~
//     //   ${Math.floor((count.count * 2) / 3) - 1}`
//     // );
//     // console.log(`${Math.floor((count.count * 2) / 3)} ~ ${count.count}`);
//     // 0 ~ NaN
//     // NaN ~ NaN
//     // NaN ~ [object Object]
//     // 0 ~ 50181
//     // 50182 ~ 100364
//     // 100365 ~ 150548
//     return;
//   } catch (error) {
//     console.log(error);
//   }
// };

// updateWithES();

// for (
//   let i = (offset - 1) * 50000 + start;
//   i < (offset - 1) * 50000 + start + 50000;
//   i++ //최대치를 넘어가지 못하게 수정
// ) {
//   console.log(i);
// }
