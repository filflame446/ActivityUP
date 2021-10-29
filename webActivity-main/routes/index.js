var express = require('express');
var router = express.Router();
const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://test123:test123@clusteractivity.oqe3k.mongodb.net/LoginDB?retryWrites=true";
const assert = require('assert');
var objectId = require('mongodb').ObjectID;
var id = require('mongodb').id;
const { stringify } = require('querystring');
const { count } = require('console');

var passport = require('passport');
const { start } = require('repl');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.redirect('/home')
});

// router.get('/Dashboard', enSureAuthencated, authRole('Student'), async function(req, res, next) {
//     const client = new MongoClient(uri);
//     await client.connect();
//     const users = await client.db('LoginDB').collection('data').findOne({});
//     console.log(users);
//     res.render('Dashboard', { 'data': users });
// });
/////////////////////////////////////////////////////////////
router.get('/DashboardProfile', enSureAuthencated, authRole('Student'), async function(req, res, next) {
    const client = new MongoClient(uri);
    await client.connect();
    const users = await client.db('LoginDB').collection('data').findOne({});
    console.log(users);
    res.render('DashboardProfile', { 'data': users });
});
/////////////////////////////////////////////////////////////
router.get('/Dashboard', enSureAuthencated, authRole('Student'), async function(req, res, next) {
    const client = new MongoClient(uri);
    await client.connect();
    const users = await client.db('LoginDB').collection('data').findOne({});
    const activity = await client.db('LoginDB').collection('data').aggregate([{
            $lookup: {
                from: 'Log',
                localField: 'ActivityName',
                foreignField: 'activity',
                as: 'logDetail'
            }
        },
        {
            $group: { _id: { ActivityName: "$ActivityName", startTime: "$startTime", endTime: "$endTime", score: "$score", studenId: "$logDetail.id" } }
        },
    ])
    ;

    let userID = req.user.username;
    let datas = [];
    for await (const doc of activity) {
        studentList = doc['_id']['studenId']
        if (studentList.includes(userID)) {
            doc['_id']['Joined'] = true;
            
        } else {
            doc['_id']['Joined'] = false;
        }
        datas.push(doc['_id']);
    }

    datas.sort(function(a, b) {
        var keyA = new Date(a.Joined);
        var  keyB = new Date(b.Joined);
        // Compare the 2 dates
        if (keyA > keyB) return -1;
        if (keyA < keyB) return 1;
        return 0;
      });

    console.log(datas);
    res.render('Dashboard', { 'data': users, 'data2': datas, 'userID': userID });
});


/////////////////////////////////////////////////////////////
//admin
router.get("/Dashboardadmin", authRole('admin'), async function(req, res) {
        const client = new MongoClient(uri);
        await client.connect();
        const users = await client.db('LoginDB').collection('data').find({}).toArray();
        await client.close();
        console.log(users);
        res.render("Dashboardadmin", { 'data': users });
    })
function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}

router.get('/insert', async function(req, res, next) {
    let startDate = new Date();
    let endDate = new Date();
    //2018-06-12T19:30
    let stardDateStr = startDate.getFullYear() + "-" + pad(startDate.getMonth() + 1, 2) + "-" + pad(startDate.getDate(), 2) + "T" + pad(startDate.getHours(), 2) + ":" + pad(startDate.getMinutes(), 2);
    let endDateStr = endDate.getFullYear() + "-" + pad(endDate.getMonth() + 1, 2) + "-" + pad(endDate.getDate(), 2) + "T" + pad(endDate.getHours(), 2) + ":" + pad(endDate.getMinutes(), 2);
    console.log(stardDateStr);
    console.log(endDateStr);

    const alarmMessage = '';
    const Qplace = '';
    const QActivity = '';

    res.render("insert", { 'startDate': stardDateStr, 'endDate': endDateStr, 'alarmMessage': alarmMessage, 'Qplace': Qplace, 'QActivity': QActivity });

});

router.post('/insert', async function(req, res, next) {
    const client = new MongoClient(uri);
    const diffTime = new Date(req.body.endTime).getTime() - new Date(req.body.startTime).getTime();
    const dateNow = new Date();
    const actName = req.body.ActivityName;

    console.log('Check Dup' + actName);

    await client.connect();
    const chkData = await client.db('LoginDB').collection('data').findOne({ ActivityName: actName });
    await client.close();

    let isDuplicateActivity = false;

    let startDate = new Date(req.body.startTime);
    let endDate =new Date(req.body.endTime);
        
    let startDateStr = startDate.getFullYear() + "-" + pad(startDate.getMonth() + 1, 2) + "-" + pad(startDate.getDate(), 2) + "T" + pad(startDate.getHours(), 2) + ":" + pad(startDate.getMinutes(), 2);
    let endDateStr = endDate.getFullYear() + "-" + pad(endDate.getMonth() + 1, 2) + "-" + pad(endDate.getDate(), 2) + "T" + pad(endDate.getHours(), 2) + ":" + pad(endDate.getMinutes(), 2);

    console.log(chkData);
    if (chkData != null) {
        console.log("Check data not null");
        isDuplicateActivity = true;
    }

    if (isDuplicateActivity) {        
        res.render("insert", { 'startDate': startDateStr, 'endDate': endDateStr, 'alarmMessage': 'ชื่อกิจกรรมซ้ำ', 'Qplace': req.body.place, 'QActivity': req.body.ActivityName });
        return;
    }

    scores = (Math.floor(diffTime / 3600000) > 8.0) ? 8 : (Math.floor(diffTime / 3600000));    
    console.log("Score : " + scores);

    if (scores <= 0) {
        res.render("insert", { 'startDate': startDateStr, 'endDate': endDateStr, 'alarmMessage': 'กรุณากำหนดเวลากิจกรรมให้ถูกต้อง', 'Qplace': req.body.place, 'QActivity': req.body.ActivityName });
        return;
    }

    await client.connect();
    const chkTime = await client.db('LoginDB').collection('data').findOne(
        { 
            $or: [ 
            {$and : [{startTime:{$lte:startDate}},{endTime:{$gte:startDate}}]},
            {$and : [{startTime:{$lte:endDate}},{endTime:{$gte:endDate}}]}
            ]
        }
        );
    await client.close();

    if (chkTime != null) {
        console.log("Conflict time with activity :"+ chkTime['ActivityName']+" "+chkTime['startTime']+"-"+chkTime['endTime']);
        res.render("insert", { 'startDate': startDateStr, 'endDate': endDateStr, 'alarmMessage': 'เวลาที่เลือกมีการจัดกิจกรรมอื่นอยู่ '+chkTime['ActivityName'] , 'Qplace': req.body.place, 'QActivity': req.body.ActivityName });
        return;
    }

    

    if (diffTime > 0) {
        await client.connect();
        await client.db('LoginDB').collection('data').insertOne({
            No: Date.now(),
            ActivityName: req.body.ActivityName,
            startTime: startDate,
            endTime: endDate,
            place: req.body.place,
            score: scores,
            count: 0
        });
        await client.close();
    }



    res.redirect('/Dashboardadmin');

});



//////////////////////Get////////////////////////////////
router.get('/update/:id', async function(req, res, next) {
    const id = parseInt(req.params.id);
    const client = new MongoClient(uri);
    await client.connect();
    const users = await client.db('LoginDB').collection('data').findOne({ "No": id });
    await client.close();
    console.log(users);
    res.render('update', { 'data': users })
});

////////////////////update/////////////////////////////
router.post('/update/:id', async(req, res) => {

        const id = parseInt(req.params.id);
        const client = new MongoClient(uri);
        const diffTime = new Date(req.body.endTime).getTime() - new Date(req.body.startTime).getTime();
        scores = (Math.floor(diffTime / 3600000) > 8.0) ? 8 : (Math.floor(diffTime / 3600000));
        console.log("Score : " + scores);
        if (diffTime < 0) return res.redirect('/update/<%=data.No%>');
        await client.connect();
        await client.db('LoginDB').collection('data').updateOne({ 'No': id }, {
            "$set": {
                ActivityName: req.body.ActivityName,
                startTime: req.body.startTime,
                endTime: req.body.endTime,
                place: req.body.place,
                score: scores,
            }
        });
        await client.close();
        res.redirect('/Dashboardadmin');
    })
    ///////////////////Delete////////////////////////////
router.post('/delete/:id', async(req, res) => {
        const id = parseInt(req.params.id);
        const client = new MongoClient(uri);

        await client.connect();
        await client.db('LoginDB').collection('data').deleteOne({ 'No': id });
        await client.close();
        res.redirect('/Dashboardadmin');
    })
    ////////////////////////////////////////////////////

router.get('/listweing/:activityname', async(req, res, next) => {
    const activityName = req.params.activityname;
    const client = new MongoClient(uri);
    await client.connect();
    let weingList = ['bour', 'chiangrang', 'jomtong', 'kaluang', 'lor', 'namtao'];
    let weingListThai = ['เวียงบัว', 'เวียงเชียงเเรง', 'เวียงจอมทอง', 'เวียงกาหลวง', 'เวียงลอ', 'เวียงน้ำเต้า'];
    let weingCount = [0, 0, 0, 0, 0, 0];

    console.log(activityName);
    console.log(weingList.length);

    for (i = 0; i < weingList.length; i++) {
        countWeing = await client.db('LoginDB').collection('Log').aggregate([{
                $lookup: {
                    from: 'posts',
                    localField: 'id',
                    foreignField: '_id',
                    as: 'postsdetail'
                }

            },
            {
                $match: { "weing": weingList[i], "activity": activityName }
            },
            {
                $group: { _id: { id: "$id", name: "$name", weing: "$weing" } }
            },
            {
                $count: "counts"
            }
        ]);

        for await (const doc of countWeing) {
            // console.log(doc);
            console.log(doc['counts']);
            weingCount[i] = doc['counts'];
        }

    }

    console.log(weingCount);

    let datas = [{
        'ActivityName': activityName,
        'WeingList': weingList,
        'WeingListThai': weingListThai,
        'WeingCount': weingCount,
    }];

    console.log(datas);

    res.render('listweing', { 'data': datas });
});

router.get('/listname/:weingname/:activityname', async(req, res, next) => {
    let weingName = req.params.weingname;
    const activityName = req.params.activityname;
    const client = new MongoClient(uri);
    await client.connect();
    let users;
    console.log(weingName);

    let datas = [];

    if (weingName == 'all') {
        users = await client.db('LoginDB').collection('Log').aggregate([{
                $lookup: {
                    from: 'posts',
                    localField: 'id',
                    foreignField: '_id',
                    as: 'postsdetail'
                }

            },
            {
                $match: { "activity": activityName }
            },
            {
                $group: { _id: { id: "$id", name: "$name", weing: "$weing" } }
            }
        ]);
        for await (const doc of users) {
            // console.log(doc);
            datas.push(doc['_id']);
        }


    } else {
        users = await client.db('LoginDB').collection('Log').aggregate([{
                $lookup: {
                    from: 'posts',
                    localField: 'id',
                    foreignField: '_id',
                    as: 'postsdetail'
                }

            },
            {
                $match: { "weing": weingName, "activity": activityName }
            },
            {
                $group: { _id: { id: "$id", name: "$name", weing: "$weing" } }
            }
        ]);
        for await (const doc of users) {
            // console.log(doc);
            datas.push(doc['_id']);
        }

    }

    let weingList = ['bour', 'chiangrang', 'jomtong', 'kaluang', 'lor', 'namtao'];
    let weingListThai = ['เวียงบัว', 'เวียงเชียงเเรง', 'เวียงจอมทอง', 'เวียงกาหลวง', 'เวียงลอ', 'เวียงน้ำเต้า'];
    let indexWeing = weingList.indexOf(weingName);
    if(indexWeing>-1)
    {
        weingName = weingListThai[indexWeing];
    }
    console.log(weingName);

    console.log(datas);
    await client.close();

    res.render('listname', { 'data': datas, 'weingName': weingName });

})

router.get('/home', function(req, res, next) {
    res.render('home');
});

router.get("/home/WeingBour", function(req, res) {
    res.render("WeingBour");
});

router.get("/home/WeingChiangRang", function(req, res) {
    res.render("WeingChiangRang");
});

router.get("/home/WeingJomTong", function(req, res) {
    res.render("WeingJomTong");
});

router.get("/home/WeingKaluang", function(req, res) {
    res.render("WeingKaluang");
});

router.get("/home/WeingLor", function(req, res) {
    res.render("WeingLor");
});

router.get("/home/WeingNamTao", function(req, res) {
    res.render("WeingNamTao");
});

router.get("/listname", function(req, res) {
    res.render("listname");
});

router.get("/assessmentsuccess/:activityName/:id", async function(req, res) {
    const studentID = parseInt(req.params.id);
    const activityName = req.params.activityName;

    const client = new MongoClient(uri);
    await client.connect();
    const form = await client.db('LoginDB').collection('assessmentform').findOne({ "ActivityName": activityName, "StudentID": studentID });
    await client.close()

    console.log(form);

    res.render("assessmentsuccess", { 'studentID': studentID, 'activityName': activityName, 'data': form });
});

router.get("/assessmentform/:activityName/:id", async function(req, res) {
    const studentID = parseInt(req.params.id);
    let activityName = String(req.params.activityName);
    while (activityName.includes("_")) {
        activityName = activityName.replace("_", " ");
    }

    console.log(studentID);
    console.log(activityName);
    //'Check mongodb ก่อนว่าเคยทำแบบประเมินไปแล้วหรือยัง
    const client = new MongoClient(uri);
    await client.connect();
    const form = await client.db('LoginDB').collection('assessmentform').findOne({ "ActivityName": activityName, "StudentID": studentID });
    console.log(form);
    await client.close()

    formIsDone = false;
    if (form != null) {
        console.log("Form is Done");
        formIsDone = true;
    }

    if (formIsDone) {
        res.redirect('/assessmentsuccess/' + activityName + '/' + studentID);
    } else {
        res.render("assessmentform", { 'studentID': studentID, 'activityName': activityName });
    }

});

router.post('/saveassessment/:activityName/:id', async(req, res) => {
    const studentID = parseInt(req.params.id);
    const activityName = req.params.activityName;
    const select1 = parseInt(req.body.es_id1);
    const select2 = parseInt(req.body.es_id2);
    const select3 = parseInt(req.body.es_id3);
    const select4 = parseInt(req.body.es_id4);
    const select5 = parseInt(req.body.es_id5);
    const select6 = parseInt(req.body.es_id6);
    const complain = req.body.es_complain;

    console.log(studentID);
    console.log(activityName);
    console.log(select1);
    console.log(select2);
    console.log(select3);
    console.log(select4);
    console.log(select5);
    console.log(complain);

    const client = new MongoClient(uri);

    await client.connect();
    await client.db('LoginDB').collection('assessmentform').insertOne({
        SaveTime: Date.now(),
        StudentID: studentID,
        ActivityName: activityName,
        Q1: select1,
        Q2: select2,
        Q3: select3,
        Q4: select4,
        Q5: select5,
        Q6: select6,
        Complain: complain
    });
    await client.close();

    res.redirect('/assessmentsuccess/' + activityName + '/' + studentID);

})

function enSureAuthencated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/users/login');
    }
}

function authRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            res.status(401)
            return res.send('Not allowed');
        }
        next();
    }
}

module.exports = router;