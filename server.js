const express = require('express')
const app = express()
const MongoClient = require('mongodb').MongoClient
let db
app.use(express.urlencoded({extended: true}))
app.set('view engine', 'ejs')
MongoClient.connect('mongodb+srv://admin:qwer1234@cluster0.0p5tziw.mongodb.net/todoapp?retryWrites=true&w=majority', { useUnifiedTopology: true }, function(에러, client){

    // 연결되면 할 일
    if (에러) return console.log(에러)

    db = client.db('todoapp')

    db.collection('post').insertOne( {이름 : 'John', _id : 100} , function(에러, 결과){
        console.log('저장완료')
    })

    app.listen(8080, function () {
        console.log('listening on 8080')
    })

    app.get('/write', function(req, res) {

        res.sendFile(__dirname + '/write.html')
    })

    app.get('/', function(req, res) {

        res.sendFile(__dirname + '/index.html')
    })

    app.post('/add', (req, res) => {

        res.send('전송완료')
        db.collection('post').insertOne({제목: req.body.title, 날짜: req.body.date}, function(에러, 결과) {
            console.log('저장완료')
        })
    })
})


