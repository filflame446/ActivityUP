//routes
var express = require('express');
var router = express.Router();

var User = require('../model/user');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
const { check, validationResult } = require('express-validator');

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});
router.get('/register', function(req, res, next) {
    res.render('register')
});
router.get('/login', function(req, res, next) {
    res.render('login',req.session.user)
});
router.get('/logout', function(req, res) {
    req.logOut();
    res.redirect('/home')
});

//Student,admin
router.post('/login', passport.authenticate('local', {
        failureRedirect: '/users/login',
        failureFlash: true
    }),
    function(req, res, ) {
        console.log("xx")
        if(req.user.role == 'admin'){
            req.flash("success", "ลงชื่อใช้งานเรียบร้อยแล้ว");
            res.redirect('/Dashboardadmin')
        }else{
        req.flash("success", "ลงชื่อใช้งานเรียบร้อยแล้ว");
        res.redirect('/Dashboard')
    }
});


passport.serializeUser(function(user, done) {
    done(null, user.id)
});
passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
        done(err, user);
    });
});
passport.use(new LocalStrategy(function(username, password, done) {
    User.getUserByUsername(username, function(err, user) {
        if (err) throw errors
        console.log(user);
        if (!user) {
            // ไม่มีชื่อในระบบ
            return done(null, false)
        } else {
        User.comparePassword(password, user.password, function(err, isMatch) {
            if (err) throw errors
            console.log(isMatch);
            if (isMatch) {
                return done(null, user)
            } else  { 
                return done(null, false)
            }
        });
    }
    });
    
}));

router.post('/register', [
    check('username', 'กรุณากรอกชื่อผู้ใช้งาน').notEmpty(),
    check('name', 'กรุณากรอกชื่อนามสุกล').notEmpty(),
    check('email', 'กรุณากรอกอีเมล').notEmpty(),
    check('password', 'กรุณากรอกหัสผ่าน').notEmpty()
], function(req, res, next) {
    const result = validationResult(req);

    var errors = result.errors;
    //cheack data
    if (!result.isEmpty()) {
        //return error to views
        res.render('register', {
            errors: errors
        })
    } else {
        //insert data
        var username = req.body.username;
        var name = req.body.name;
        var email=req.body.email;
        var password = req.body.password;
        var newUser = new User({
            username: username,
            name: name,
            password: password,
            email:email,
        });
        User.createUser(newUser, function(err, _user) {
            if (err) throw err
        });
        //การกลับไปหน้าต่างๆ
        res.location('/Dashboard')
        res.redirect('/Dashboard')
    }
});


module.exports = router;