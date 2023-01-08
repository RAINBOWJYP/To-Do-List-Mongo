const { response } = require('express');
const express = require('express'); //설치한 라이브러리를 첨부해주세요.
const app = express(); //express를 사용해주세요.
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));
app.use(methodOverride('_method'));

var db;

const MongoClient = require('mongodb').MongoClient;
MongoClient.connect('mongodb+srv://admin:qwer1234@todoapp.g4tnfjb.mongodb.net/todoapp?retryWrites=true&w=majority', (에러, client) => {
    if (에러) { return console.log('에러 ' + 에러) }
    db = client.db('todoapp');

    app.listen(8080, function () {
        console.log('listening on 8080')
    }); //원하는 포트에 서버를 오픈하는 문법

})

app.post('/add', (request, response) => {
    db.collection('counter').findOne({ name: '게시물 갯수' }, (error, 결과) => {
        console.log(결과.totalPost)
        var totalPost = 결과.totalPost
        db.collection('post').insertOne({ _id: totalPost + 1, title: request.body.title, contents: request.body.contents }, (error, result) => {
            console.log('저장완료');
            //counter라는 콜렉션에 있는 totalPost 값도 1 증가해야됨
            db.collection('counter').updateOne({ name: '게시물 갯수' }, { $inc: { totalPost: 1 } }, (error, 결과) => { if (error) { return console.log(error) } })
        });
    });

    response.sendFile(__dirname + '/add.html')
})


app.get('/', (request, response) => {
    response.render('list.ejs')
})

app.get('/write', (request, response) => {
    response.render('write.ejs')
})

app.get('/list', (request, response) => {
    //db에 저장된 post라는 collection안의 모든 데이터를 or id=?인 데이터를 꺼주세요.
    db.collection('post').find().toArray((에러, 결과) => {
        console.log(결과 + "제발")
        response.render('list.ejs', { posts: 결과 });
    }); //모든 데이터 가져오기
})

app.delete('/delete', (request, response) => {
    request.body._id = parseInt(request.body._id);
    db.collection('post').deleteOne({ _id: request.body._id }, (에러, 결과) => {
        console.log(request.body._id);
        response.status(200).send({ message: '삭제 성공했습니다.' });
    })
})

app.get('/detail/:id', (요청, 응답) => {
    db.collection('post').findOne({ _id: parseInt(요청.params.id) }, (에러, 결과) => {
        console.log(결과)

        응답.render('detail.ejs', { data: 결과 });
    });
})

app.get('/edit/:id', (요청, 응답) => {
    db.collection('post').findOne({
        _id: parseInt(요청.params.id)
    }, (에러, 결과) => {
        console.log(결과 + "입니다다다다")
        응답.render('edit.ejs', { data: 결과 })
    })

}
)

app.put('/edit', (요청, 응답) => {
    console.log(요청.body.id)
    db.collection('post').updateOne({ _id: parseInt(요청.body.id) }, { $set: { title: 요청.body.title, contents: 요청.body.contents } }, (에러, 결과) => { console.log("수정 완료"); })
    응답.redirect('/list');
})

const passport = require('passport');
const LocalStrategy = require('passport-local')
    .Strategy;
const session = require('express-session');
const { render } = require('ejs');

app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());


app.get('/login', (요청, 응답) => {
    응답.render('login.ejs');
})
app.post('/login', passport.authenticate('local', {
    failureRedirect: '/fail'
}), function (요청, 응답) {
    응답.redirect('/');
})

app.get('/mypage', 로그인했니, (요청, 응답) => {
    console.log(요청.user)
    응답.render('mypage.ejs')
})

function 로그인했니(요청, 응답, next) {
    console.log(요청.user)
    if (요청.user) {
        next()
    } else {
        응답.send('로그인 안하셨는데요??')
    }
}

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
        if (에러) return done(에러)

        if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
        if (입력한비번 == 결과.pw) {
            return done(null, 결과)
        } else {
            return done(null, false, { message: '비번틀렸어요' })
        }
    })
}));

//사용자 인증에 성공하면 사용자 정보를 세션에 저장~?
passport.serializeUser(function (user, done) {
    done(null, user.id)
});

//이사람이 세션이 있는지 없는지 확인해주는
passport.deserializeUser(function (아이디, done) {
    //디비에서 위에있는 user.id로 유저를 찾은 뒤에 유저 정보를 아래에 넣음.
    db.collection('login').findOne({ id: 아이디 }, function (에러, 결과) { done(null, 결과) })

});


/**
 * sign up */

app.get('/signup', (요청, 응답) => {
    응답.render('signup.ejs')
})

app.post('/signupadd', (요청, 응답) => {
    db.collection('user').findOne({ id: 요청.body.id }, (에러, 결과) => {
        if (에러) { return console.log('에러 ' + 에러) } else {

            console.log(결과 + "라구요")
        }
    })

})

app.get('/checkId', (request, response) => {
    console.log(request.body.id + "입니다");
    db.collection('user').findOne({ id: request.body.id }, (에러, 결과) => {
        if (!request.body.id) {
            에러(response, 403, "값을 입력해주세요.")
        }
        if (에러) {
            return console.log("/checkId error : " + 에러)
        } else {
            if (결과 != null) {
                alert("아이디 중복입니다.")
            }
        }
    })

    // db.collection('user').findOne({ id: request.body.id }, (에러, 결과) => {
    //     console.log(request.body.id);
    //     response.status(200).send({ message: '찾았어요.' });
    // })
})