const client = require("../ELK_connection");

// 이를 사용해서 업데이트 할 수 있다. 
// 필드명이 없다면 생성하고 이미 있다면 업데이트 해주기 때문에 아무걱정없이 그냥 insert하면 되시겠다. 

let updateWithES = async () => {
  try {
    const list = await client.search({
      index: "game_data",
      body: {
        query: {
          bool: {
            must: [
              { match: { appid: 1523 } },
              { exists: { field: "review_score_desc" } },
            ],
          }
        }
      }
    })
    console.log(list.hits)
    console.log(list.hits.total["value"] ? list.hits.hits[0]._id : false)
    // const id = list.hits.hits[0]._id
    // const result = await client.update({
    //   index: "game_data",
    //   id: id,
    //   body: {
    //     doc: {
    //       "new": "안 안녕한데요??"
    //     }
    //   }
    // });
    // console.log(result)
    return;
  } catch (error) {
    console.log(error)

  }
};

updateWithES()
