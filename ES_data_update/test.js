const EngReview = require('./review_english')
const KorReview = require('./review_kor')

const eng = new EngReview()
const kor = new KorReview()

eng.work(10, 777)
kor.work(292030, 666)