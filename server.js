const express = require('express')
const app = express()
const methodOverride = require('method-override')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const session = require('express-session')
require('dotenv').config()


app.set('view engine', 'ejs')
app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'))
app.use('/public', express.static('public'))

app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}))
app.use(passport.initialize())
app.use(passport.session())

app.get('/write', (req, res) => res.render(__dirname + '/views/write.ejs'))
app.get('/', (req, res) => res.render(__dirname + '/views/index.ejs'))
app.get('/login', (req, res) => res.render('login.ejs'))

app.get('/mypage', 로그인했니,(req, res) => {
    
    res.render('mypage.ejs', { 사용자: req.user })
})
function 로그인했니(req, res, next) {
    if (req.user) {
        next()
    } else {
        res.send('로그인안하셨는데요?')
    }
}

const MongoClient = require('mongodb').MongoClient
let db
MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true }, function(에러, client){

    // 연결되면 할 일
    if (에러) return console.log(에러)

    db = client.db('todoapp')

    app.listen(process.env.PORT, () => console.log('listening on 8080'))
})

app.post('/add', (req, res) => {

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

app.get('/edit/:id', (req, res) => {

    db.collection('post').findOne({_id: parseInt(req.params.id)}, (err, result) => {

        res.render('edit.ejs', { post: result })
    })
})

app.put('edit', (req, res) => {

    console.log(req.body)

    db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set: { 제목: req.body.title , 날짜: req.body.date } }, (err, result) => {
        console.log(err)
        console.log('수정완료')        
        res.redirect('/list')
    })
})

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/fail'
}), (req, res) => {
    res.redirect('/')
})

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
    console.log(입력한아이디, 입력한비번)
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
        if (에러) return done(에러)

        if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
        if (입력한비번 == 결과.pw) {
            return done(null, 결과)
        } else {
            return done(null, false, { message: '비번틀렸어요' })
        }
    })
}))

passport.serializeUser(function (user, done) {
    done(null, user.id)
})

passport.deserializeUser(function (아이디, done) {
    db.collection('login').findOne({ id: 아이디 }, function (에러, 결과) {
        done(null, 결과)
    })
})

app.post('/register', (req, res) => {
    db.collection('login').insertOne({ id: req.body.id, pw: req.body.pw }, (err, result) => {
        res.redirect('/')
    })
})


app.get('/search', (req, res) => {
    const 검색조건 = [
        {
            $search: {
                index: 'titleSearch',
                text: {
                    query: req.query.value,
                    path: '제목'
                }
            }
        },
        {
            $project: {
                _id: 0,
                제목: 1,
                날짜: 1
            }
        }
    ]
    
    db.collection('post').aggregate(검색조건).toArray((err, result)=>{
        res.render('search.ejs', { posts : result })
    })
})
