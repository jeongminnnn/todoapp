const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

router.get('/', (req, res) => res.render('login'));
router.get('/fail', (req, res) => {
    res.send('Login failed. Please check your credentials and try again.');
})

module.exports = (db) => {
    // Passport Local Strategy
    passport.use(new LocalStrategy({
        usernameField: 'id',
        passwordField: 'pw',
        session: true,
        passReqToCallback: false,
    }, async (username, password, done) => {
        console.log(username, password);
        try {
            const user = await db.collection('login').findOne({ id: username });
            if (!user) return done(null, false, { message: '존재하지 않는 아이디요' });

            if (password == user.pw) {
                return done(null, user);
            } else {
                return done(null, false, { message: '비밀번호가 틀렸어요' })
            }
        } catch (error) {
            return done(error)
        }
    }))

    // Serialize and Deserialize User
    passport.serializeUser((user, done) => {
        done(null, user.id)
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await db.collection('login').findOne({ id: id });
            done(null, user);
        } catch (error) {
            done(error)
        }
    });

    // Login Route
    router.post('/login', (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            if (err) {
                // Handle error if any error occurs in LocalStrategy
                return next(err);
            }
            if (!user) {
                // Handle incorrect password
                return res.redirect('/fail');
            }
            // Log the user in
            req.logIn(user, (err) => {
                if (err) {
                    return next(err);
                }
                return res.redirect('/');
            });
        })(req, res, next);
    });


    // Register Route
    router.post('/register', async (req, res) => {
        try {
            await db.collection('login').insertOne({ id: req.body.id, pw: req.body.pw });
            res.redirect('/');
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Failed to register' });
        }
    });

    return {
        passportStrategy: passport.authenticate('local'),
        router: router
    };
};
