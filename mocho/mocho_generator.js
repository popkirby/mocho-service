const sqlite3 = require('sqlite3')
const co = require('co')

const DB_PATH = 'chain.db'
const BEGIN = '__MOCHO_BEGIN__'
const END = '__MOCHO_END__'

const database = new sqlite3.Database(DB_PATH)

function getFirstTriplet() {
  return new Promise((resolve, reject) => {
    database.all("select prefix1, prefix2, suffix, freq from chain_freqs where prefix1 = ?", BEGIN, (err, rows) => {
      return resolve(getProbableTriplet(rows))
    })
  })
}
function getTripletFromPrefix(prefix1, prefix2) {
  return new Promise((resolve, reject) => {
    database.all("select prefix1, prefix2, suffix, freq from chain_freqs where prefix1 = ? and prefix2 = ?",
      [prefix1, prefix2], (err, rows) => {
      return resolve(getProbableTriplet(rows))
    })
  })
}
function getProbableTriplet(rows) {
  const probability = []
  for (let row of rows) {
    const index = [row['prefix1'], row['prefix2'], row['suffix']]
    for (let i = 0; i < row.freq; i++) {
      probability.push(index);
    }
  }

  const chosenTriplet = probability[Math.floor(Math.random() * probability.length)]
  return chosenTriplet
}

co(function *() {
  let generated_text = ''
  let prefix1, prefix2
  // 1つ目のtripletを取得
  const first_triplet = yield getFirstTriplet()

  // 文章に追加
  generated_text += first_triplet[1] + first_triplet[2]
  prefix1 = first_triplet[1]
  prefix2 = first_triplet[2]

  // ループして文章を作る
  for(let i = 0; i < 10000000; i++) {
    const triplet = yield getTripletFromPrefix(prefix1, prefix2)
    if (triplet[2] === END) break
    generated_text += triplet[2]
    prefix1 = triplet[1]
    prefix2 = triplet[2]
  }

  database.close()

  generated_text = generated_text.replace(BEGIN, '').replace(END, '').replace(/EOS/g, '\n')
  console.log(generated_text)

})
