const express = require('express')
const app = express()
const path = require('path')
const session = require('express-session')
const passport = require('passport')
const bodyParser = require('body-parser')
const LocalStrategy = require('passport-local').Strategy
require('dotenv').config()

app.use('/static', express.static('static'))
app.use(bodyParser.json())

const MongoClient = require('mongodb').MongoClient
const uri = process.env.DB_URL
const client = new MongoClient(uri, { useUnifiedTopology: true })
async function startServer() {
    try{

        await client.connect()
        const db = client.db('todoapp')

        // Middleware to attach 'db' to the 'req' object
        app.use((req, res, next) => {
            req.db = db
            next()
        })

        // Passport Middleware
        app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}))
        app.use(passport.initialize())
        app.use(passport.session())

        // Middleware to check login status and redirect to /login if not logged in
        app.use((req, res, next) => {
            if (req.user || req.path === '/login') {
                // If the user is logged in or accessing the /login page, proceed to the next middleware/route.
                next();
            } else {
                // If the user is not logged in and not accessing the /login page, redirect to /login.
                res.redirect('/login');
            }
        })

        // routes
        app.get('/write', (req, res) => res.render(__dirname + '/views/write.ejs'))
        app.get('/', (req, res) => res.render(__dirname + '/views/index.ejs'))
        app.get('/login', (req, res) => res.render('login.ejs'))

        // Use authRouter.passportStrategy directly as middleware for /login route
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

        // Include the /register route from authRouter.router
// Include the /register route from authRouter.router
app.post('/register', (req, res) => {
    const id = req.body.id;
    const pw = req.body.pw;

    // Check if the id already exists in the db
    db.collection('login').findOne({ id: id }, (err, result) => {
        if (err) {
            console.error('Error:', err)
            res.status(500).json({ message: 'Internal Server Error' })
        } else {
            if (result) {
                res.status(409).json({ message: '이미 존재하는 아이디입니다.' })
            } else {
                db.collection('login').insertOne({ id: id, pw: pw }, (err, result) => {
                    if (err) {
                        res.status(500).json({ message: 'Internal Server Error' })
                    } else {
                        res.status(200).json({ message: 'Registration successful' })
                    }
                })
            }
        }
    });
});

        app.get('/list', (req, res) => {

            db.collection('post').find().toArray((err, result) => {
                res.render('list.ejs', { posts : result })
            })
        })

    app.listen(process.env.PORT, () => console.log('Listening on 8080'))

    } catch (err) {
        
        console.error('Error:', err)
    }   
}

startServer()

const methodOverride = require('method-override')


app.set('view engine', 'ejs')
app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'))

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

app.post('/add', (req, res) => {

    db.collection('counter').findOne({ name:'게시물갯수' }, (err, result) => {

        let 총게시물갯수 = result.totalPost
        const post = { _id: 총게시물갯수+1, 제목: req.body.title, 날짜: req.body.date, 작성자: req.user._id }

        db.collection('post').insertOne(post, (err, result) => {
            console.log('저장완료')

            db.collection('counter').updateOne({ name:'게시물갯수' }, { $inc : {totalPost:1} }, (err, result) => {
                if (err) {return console.log(err)}
            })
        })
    })
})

app.delete('/delete', (req, res) => {

    req.body._id = parseInt(req.body._id)

    const deleteFilter = { _id: req.body._id, 작성자: req.user._id }

    db.collection('post').deleteOne(deleteFilter, (err, result) => {
        console.log('삭제완료')
        res.status(200).send({ message: '성공했습니다.' })
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

app.use('/shop', require('./routes/shop.js'))

app.use('/board/sub', require('./routes/board.js'))

let multer = require('multer')
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './static/image')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname + new Date())
    },
    fileFilter: function (req, file, cb) {
        const ext = path.extname(file.originalname)
        if (ext !== '.jpg' && ext !== '.png' && ext !== '.gif' && ext !== '.jpeg') {
            return cb(res.status(400).end('jpg, png, gif, jpeg만 업로드 가능합니다.'))
        }
        cb(null, true)
    },
    limits:{
        fileSize: 1024 * 1024
    }
})
let upload = multer({ storage: storage })

app.get('/upload', (req, res) => {
    res.render('upload.ejs')
})

app.post('/upload', upload.single('profile'), (req, res) => {
    res.send('업로드완료')
})

app.get('/image/:imageName', (req, res) => {
    res.sendFile(__dirname + '/static/image/' + req.params.imageName)
})

const { ObjectId } = require('mongodb')
app.post('/chatroom', 로그인했니, (req, res) => {
    
    const chat = {
        title: '채팅방',
        member : [ObjectId(req.body.당한사람id), req.user._id],
        date: new Date()
    }
    db.collection('chatroom').insertOne(chat).then((err, result) => {
        res.send('채팅방 생성완료')
    })
})

app.get('/chat', 로그인했니, (req, res) => {
    db.collection('chatroom').find({ member : req.user._id }).toArray().then((result)=>{
        res.render('chat.ejs', {data : result})
    })
})

app.post('/message', 로그인했니, (req, res) => {
    const message = {
        parent: req.body.parent,
        content: req.body.content,
        userid: req.user._id,
        date: new Date()
    }
    console.log(req.body)
    db.collection('message').insertOne(message)
        .then((err, result) => {
            res.json({ message: 'db 저장완료' })
        })
        .catch(err => {
            console.error('Error:', err)
            res.status(500).json({ error: 'Failed to save to the database' })
        })
})

app.get('/message/:id', 로그인했니, (req, res) => {

    res.writeHead(200, {
        "Connection": "keep-alive",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
    })

    db.collection('message').find({ parent: req.params.id }).toArray().then((result) => {
        res.write('event: message\n')
        res.write('data: ' + JSON.stringify(result) + '\n\n')
    })
})