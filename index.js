const express = require('express')
const app = express()
const mocho_oneline = require('./mocho/mocho_generator_oneline')

app.set('port', (process.env.PORT) || 5000)
app.use(express.static(__dirname + '/static'))

app.get('/oneline', (request, response) => {
  mocho_oneline().then((generated) => {
    response.send(generated)
  })
})

app.listen(app.get('port'), () => {
  console.log('Node app is running on port', app.get('port'))
})

