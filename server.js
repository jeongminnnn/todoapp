const express = require('express')
const app = express()

app.use(express.urlencoded({extended: true}))
app.set('view engine', 'ejs')


app.get('/write', (req, res) => res.sendFile(__dirname + '/write.html'))

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'))

const MongoClient = require('mongodb').MongoClient
let db
MongoClient.connect('mongodb+srv://admin:qwer1234@cluster0.0p5tziw.mongodb.net/todoapp?retryWrites=true&w=majority', { useUnifiedTopology: true }, function(에러, client){

    // 연결되면 할 일
    if (에러) return console.log(에러)

    db = client.db('todoapp')

    app.post('/add', (req, res) => {

        res.send('전송완료')

        db.collection('counter').findOne({ name:'게시물갯수' }, (err, result) => {

            let 총게시물갯수 = result.totalPost

            db.collection('post').insertOne({ _id: 총게시물갯수+1, 제목: req.body.title, 날짜: req.body.date}, (err, result) => {
                console.log('저장완료')

                db.collection('counter').updateOne({ name:'게시물갯수' }, { $inc : {totalPost:1} }, (err, result) => {
                    if (err) {return console.log(err)}
                })
            })
        })
    })

    app.get('/list', (req, res) => {

        db.collection('post').find().toArray((err, result) => {
            console.log(result)
            res.render('list.ejs', { posts : result })
        })
    })

})

app.delete('/delete', (req, res) => {

    req.body._id = parseInt(req.body._id)
    db.collection('post').deleteOne({_id: req.body._id}, (err, result) => {
        console.log('삭제완료')
        res.status(200).send({ message: '성공했습니다.' })
    })
})

app.get('/detail/:id', (req, res) => {

    db.collection('post').findOne({_id: parseInt(req.params.id)}, (err, result) => {
        console.log(result)
        res.render('detail.ejs', { data: result })
    })
})

app.listen(8080, () => console.log('listening on 8080'))