const router = require('express').Router()

router.get('/sports', (req, res) => {
    res.send('스포츠 게시판 페이지입니다.')
})

router.get('/game', (req, res) => {
    res.send('게임 게시판 페이지입니다.')
})

module.exports = router