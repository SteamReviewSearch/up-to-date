const client = require("../ELK_connection");

let finAllList = async () => {
    // 갯수세는 것 뿐
    const count = await client.count({ index: "games_data" });
    let ct=count.count
    // 시작 0 / 끝 50181} num1
    // 시작 50182 / 끝 100364} num2
    // 시작 100365 / 끝 150547} num3
    let list = [];
    let divison=Math.floor(ct/5000);
    let remain = ct%5000;

    for (let i = 0; i < 31; i++) {
      //게임 리스트
      let appids = await client.search({
        index: "game_data",
        from: i, //모든 스레드
        size: 5000,
        _source: ["appid"],
      });
      
      const hits = appids.hits.hits;
      for (let j = 0; j < hits.length; j++) {
        list.push(hits[j]._source.appid);
        // list.push(appids.hits.hits);
        // console.log(list);
      }
    }
    return list;
  }; 
const work = async () => {
    let list=await finAllList();
    for(let i of list){
        console.log(i)
        let reviews = await client.search({
            index: "review_data",
            query: {
                match:{appid:i}
            },
        });
        if(reviews.hits.hits.length===0){
            continue;
        }
        let recommendationid_list={};
        for(let j of reviews.hits.hits){
            if(recommendationid_list[j._source.recommendationid]===undefined){
                recommendationid_list[j._source.recommendationid]={
                    count:1,
                    id:[]
                };
                recommendationid_list[j._source.recommendationid].id.push(j._id);
            }else{
                recommendationid_list[j._source.recommendationid].count++;
                recommendationid_list[j._source.recommendationid].id.push(j._id);
            }
        }
        let same=[];
        for(let j in recommendationid_list){
            same.push([j,recommendationid_list[j].count,recommendationid_list[j].id]);
        }
        same=same.filter(ele=>{
            return ele[1]>1
        })
        for(let ele of same){
            console.log(ele)
            for(let j in ele[2]){
                if(j != 0){
                    console.log(ele[2][j]/1)
                    await client.delete({
                            index: "review_data",
                            id:ele[2][j],
                        })
                }
            }
        }
    }
    // let knn = await client.search({
    //     index: "review_data",
    //     query: {
    //     },
    // });
}
//games doc 삭제
// const work = async () => {
//     // let list=await finAllList();
//     // for(let i of list){
        
//     // }
//     while(1){
//         let knn = await client.search({
//             index: "games_data",
//             query: {
//                 exists: {
//                     field: "doc",
//                 },
//             },
//         });
//         if(knn.hits.hits.length===0){
//             console.log("end")
//             break;
//         }
//         try {
//             for(let i of knn.hits.hits){
//                 console.log(i._id)
//                 await client.delete({
//                     index: 'games_data',
//                     id:i._id,
//                 })
//             }
//         } catch (error) {
//             console.log(error)
//         }
//     };
// }
    work();
