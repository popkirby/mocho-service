const MeCab = new require('mecab-async')
const mecab = new MeCab()
mecab.command = 'mecab -d /usr/local/lib/mecab/dic/mecab-ipadic-neologd'

const sqlite3 = require('sqlite3')
const fs = require('fs')

// bi-gramなモデルを作成
const BEGIN = '__MOCHO_BEGIN__'
const END = '__MOCHO_END__'
const DB_PATH = 'chain.db'
const DB_SCHEMA_PATH = 'bigram.sql'

const mocho_files = fs.readdirSync('./articles').filter((val) => /^\d+\.txt$/.test(val))
// 形態素解析の結果から3つ組(prefix1, prefix2, suffix)の組のMapを作る
// Map { "prefix1,prefix2,suffix" : int(出現回数) }
function createTriplets(morphemes) {
  // 3つ組が作れないなら帰る(あんまりない)
  if (morphemes.length < 3) {
    return {}
  }

  const tripletsMap = {}
  for (let i = 0; i < morphemes.length - 2; i++) {
    let triplet = [morphemes[i], morphemes[i + 1], morphemes[i + 2]]
    if (!tripletsMap[triplet]) {
      tripletsMap[triplet] = 0
    } else {
      tripletsMap[triplet] += 1
    }
  }

  // 最初
  tripletsMap[[BEGIN, morphemes[0], morphemes[1]]] = 1

  // 最後
  tripletsMap[[morphemes[morphemes.length - 2], morphemes[morphemes.length - 1], END]] = 1

  return tripletsMap
}

const tripletFreqs = {}

for (let files of mocho_files) {
  const fileStr = fs.readFileSync(`articles/${files}`).toString().replace(/\n{2,}/g, '\n')
  // 形態素解析
  const morphemes = mecab.wakachiSync(fileStr)
  // 3つ組を取得
  const triplets = createTriplets(morphemes)
  
  for (let triplet in triplets) {
    if (!tripletFreqs[triplet]) {
      tripletFreqs[triplet] = 1
    } else {
      tripletFreqs[triplet] += 1
    }
  }
}


// データベースに書き込み
const database = new sqlite3.Database(DB_PATH)
database.exec(`
  drop table if exists chain_freqs;
  create table chain_freqs(
    id integer primary key autoincrement not null,
    prefix1 text not null,
    prefix2 text not null,
    suffix text not null,
    freq integer not null
  );`)

const statement = database.prepare('insert into chain_freqs (prefix1, prefix2, suffix, freq) values (?, ?, ?, ?)')

for (let triplet in tripletFreqs) {
   const [prefix1, prefix2, suffix] = triplet.split(',')
   const freq = tripletFreqs[triplet]
   statement.run([prefix1, prefix2, suffix, freq])
}

statement.finalize();

database.close()

