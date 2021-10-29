const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bcrypt = require('bcryptjs');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const db = mongoose.connection;
const cors = require('cors')



///////////////Heroku////////////////////
const port = process.env.PORT || 3000;
const date = require('date-and-time');

/////////////////////////////////////////
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session')
const assert = require('assert');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const { callbackify } = require('util');

const app = express();
app.use(cookieParser());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set(express.static(__dirname + '../public'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));
app.use(express.static('views'));
app.use(express.static('admin'));
app.use(require('connect-flash')());

app.use(function(req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});
const dataSchema = {
        username: String,
        email: String,
        role: String

    }
    // const data   = mongoose.model(data,dataSchema)

app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());



app.get('*', function(req, res, next) {
    res.locals.user = req.user || null;
    next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);


// //สร้างข้อมูล
// app.get('/EditDashboardadmin', async(req, res) => {
//     const client = new MongoClient(uri);
//     await client.connect();
//     const users = await client.db('LoginDB').collection('data').find({}).toArray();
//     await client.close();
//     res.status(200).send(users);
// })


// //อ่านข้อมูลทั้งหมด
// app.get('/users', async(req, res) => {
//     const id = parseInt(req.params.id);
//     const client = new MongoClient(uri);
//     await client.connect();
//     const users = await client.db('mydb').collection('users').find({}).toArray();
//     await client.close();
//     res.status(200).send(users);
// })

// //อ่านข้อมูลแบบเจาะจง
// app.get('/users/:id', async(req, res) => {
//     const id = parseInt(req.params.id);
//     const client = new MongoClient(uri);
//     await client.connect();
//     const user = await client.db('mydb').collection('users').findOne({"id": id});
//     await client.close();
//     res.status(200).send({
//       "status": "ok",
//       "user": user
//     });
// })

// //อัพเดทข้อมูล 
// app.put('/users/update', async(req, res) => {
//     const user = req.body;
//     const id = parseInt(user.id);
//     const client = new MongoClient(uri);
//     await client.connect();
//     await client.db('mydb').collection('users').updateOne({'id': id}, {"$set": {
//       id: parseInt(user.id),
//       fname: user.fname,
//       lname: user.lname,
//       username: user.username,
//       email: user.email,
//     }});
//     await client.close();
//     res.status(200).send({
//       "status": "ok",
//       "message": "User with ID = "+id+" is updated",
//       "user": user
//     });
// })

// //ลบข้อมูล
// app.delete('/users/delete', async(req, res) => {
//     const id = parseInt(req.body.id);
//     const client = new MongoClient(uri);
//     await client.connect();
//     await client.db('mydb').collection('users').deleteOne({'id': id});
//     await client.close();
//     res.status(200).send({
//       "status": "ok",
//       "message": "User with ID = "+id+" is deleted"
//     });
// })

module.exports = app;