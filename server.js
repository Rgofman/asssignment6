//https://relieved-foal-shift.cyclic.app/
//https://github.com/Rgofman/assignment6/
// admin user: Admin@gmail.com
// admin pass: Admin123


const express = require("express");
const app = express();
const path = require('path');
const handlebars = require("express-handlebars");
const bodyParser = require("body-parser")
const multer = require("multer");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const clientSessions = require("client-sessions");
const bcrypt = require('bcrypt');

var db1 = mongoose.connect("mongodb+srv://rgofman:Letmein123@cluster0.ndiiils.mongodb.net/?retryWrites=true&w=majority");

app.engine(".hbs", handlebars.engine({ extname: '.hbs' }));
app.set("view engine", ".hbs");
app.use(express.static("./"));
app.use(bodyParser.urlencoded({ extended: false }));

let multer_obj = multer.diskStorage({
    destination: './views'
});


var customers_schema = new Schema({
    "firstName": String,
    "lastName": String,
    "email": String,
    "password": String,
    "phone": Number
});

var article_schema = new Schema({
    "title": String,
    "date": Date,
    "content": String,
    "imgName": String
});


const customers = mongoose.model("customers", customers_schema);
const articles = mongoose.model("articles", article_schema);

app.use(express.urlencoded({ extended: false }));

app.use(clientSessions({
    cookieName: "session",
    secret: "userSess",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60
}));

var port = process.env.PORT || 8080;

function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

app.get("/", function (req, res) {
    var data = {
        title: "",
        content: "",
        image: "",
        date: "",
        dataH: ''
    }
    articles.find({})
        .exec()
        .then((article) => {
            article = article.map(value => value.toObject());
            for (let i = 0; i < article.length; i++) {
                data.title = article[i].title,
                    data.content = article[i].content,
                    data.image = "/static/".concat(article[i].imgName),
                    data.date = article[i].date
            }
            res.render("blog", { data: data, layout: "main2" });
        });
});


app.get("/login", function (req, res) {
    res.render("login", { layout: "main" });
});


app.get("/logout", function (req, res) {
    req.session.reset();
    res.redirect("/login");
});

app.get("/dashboard", ensureLogin, function (req, res) {
    res.render("dashboard", { layout: "main2" });
});

app.get("/admin", function (req, res) {
    res.render("admin", { layout: "main2" });
});

var Name;
var LastName;

app.post("/login", function (req, res) {
    var data = {
        userInfo: {
            password: req.body.password,
            username: req.body.username,
            name: "",
            last: ""
        },
        errorMsg: {
            username: "",
            password: "",
            yn: "",
            notFound: ""
        }
    };
    if (!data.userInfo.username) {
        data.errorMsg.username = "The username is required";
        data.errorMsg.yn = 1;
    }
    if (/[ `!#$%^&*()_+\-=\[\]{};':"\\|,<>\/?~]/.test(data.userInfo.username)) {
        data.errorMsg.username = "Cant have special characters";
        data.errorMsg.yn = 1;
    }

    if (!data.userInfo.password) {
        data.errorMsg.password = "Password is required";
        data.errorMsg.yn = 1;
    }

    if (data.errorMsg.yn != 1) {
        customers.findOne({ email: data.userInfo.username })
            .exec()
            .then((customers) => {

                bcrypt.compare(data.userInfo.password, customers.password).then((result) => {

                    if (result) {
                        if (data.userInfo.username == 'Admin@gmail.com') {
                            const names = customers.firstName;
                            user = {
                                username: data.userInfo.username,
                                email: data.userInfo.email
                            };

                            res.render("admin", { stuff: names, user: user, layout: "main2" });
                            return;
                        }
                        else {
                            user = {
                                username: data.userInfo.username,
                                email: data.userInfo.email
                            };
                            const names = customers.firstName + " " + customers.lastName

                            res.render("dashboard", { stuff: names, user: user, layout: "main2" });
                            return;
                        }
                        req.session.user = {
                            username: user.username,
                            email: user.email
                        };
                    }

                    else {
                        data.errorMsg.notFound = "Username and Password do not match!";
                        res.render("login", { data: data, layout: "main" });
                        return;
                    }
                    return;

                });

            }).catch((err) => {
                data.errorMsg.notFound = "Username not found!";
                res.render("login", { data: data, layout: "main" });
                return;
            });

    }
    else {
        res.render("login", { data: data, layout: "main" });
    }
});


app.get("/registration", function (req, res) {
    res.render("registration", { layout: "main" });
});

app.post("/read_more", function (req, res) {
    res.render("read_more", { layout: "main" });
})



app.post("/admin", function (req, res) {
    var data = {
        userInfo: {
            title: req.body.title,
            date: req.body.date,
            content: req.body.content,
            imgName: req.body.img
        },
        errorMsg: {
            msg: ""
        }
    };


    if (data.userInfo.imgName.includes('png') || data.userInfo.imgName.includes('jpg') || data.userInfo.imgName.includes('gif')) {
        let article = new articles({
            title: data.userInfo.title,
            date: data.userInfo.date,
            content: data.userInfo.content,
            imgName: data.userInfo.imgName
        })
        article.save()
            .then(user => {
                console.log("Success!");
            })
    }
    else {
        data.errorMsg.msg = "Image must be of type png, jpg, gif"
        console.log(data.errorMsg.msg)
    }
    res.render("admin", { data: data, layout: "main2" });
})


app.post("/adminEdit", function (req, res) {
    var data = {
        userInfo: {
            title: req.body.title,
            content1: req.body.content

        },
        errorMsg: {
            msg: ""
        }
    };
    articles.updateOne(
        { title: data.userInfo.title },
        { $set: { content: data.userInfo.content1 } }
    ).exec();
    res.render("admin", { data: data, layout: "main2" });
})


app.post("/adminEditTitle", function (req, res) {
    var data = {
        userInfo: {
            title: req.body.title,
            newTitle: req.body.content
        },
        errorMsg: {
            msg: ""
        }
    };
    articles.updateOne(
        { title: data.userInfo.title },
        { $set: { title: data.userInfo.newTitle } }
    ).exec();
    res.render("admin", { data: data, layout: "main2" });
})


app.post("/registration", function (req, res) {
    var data = {
        userInfo: {
            name: req.body.name,
            lname: req.body.lname,
            password: req.body.password,
            comfPassword: req.body.comfPassword,
            phone: req.body.phone,
            email: req.body.email
        },
        errorMsg: {
            name: "",
            lname: "",
            password: "",
            comfPassword: "",
            email: "",
            phone: "",
            yn: ""
        }
    };

    if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.userInfo.email))) {
        data.errorMsg.email = "Must be valid"
        data.errorMsg.yn = 1;
    }

    if (!(/^\d+$/.test(data.userInfo.phone))) {
        data.errorMsg.phone = "Numbers only"
        data.errorMsg.yn = 1;
    }
    if (data.userInfo.phone <= 999999999 || data.userInfo.phone >= 10000000000) {
        data.errorMsg.phone = "Must be valid number"
        data.errorMsg.yn = 1;
    }

    if (!data.userInfo.name) {
        data.errorMsg.name = "Required";
        data.errorMsg.yn = 1;
    }
    if (!data.userInfo.lname) {
        data.errorMsg.lname = "Required";
        data.errorMsg.yn = 1;
    }

    if (!data.userInfo.password) {
        data.errorMsg.password = "Password is required";
        data.errorMsg.yn = 1;
    }

    else if (data.userInfo.password.length < 6 || data.userInfo.password.length > 12) {
        data.errorMsg.password = "6-12 characters";
        data.errorMsg.yn = 1;
    }

    else if (!(/\d/.test(data.userInfo.password))) {
        data.errorMsg.password = "Must have 1 number";
        data.errorMsg.yn = 1;
    }

    else if (!(/[a-z]/i.test(data.userInfo.password))) {
        data.errorMsg.password = "Must have 1 letter";
        data.errorMsg.yn = 1;
    }

    if (data.userInfo.password != data.userInfo.comfPassword) {
        data.errorMsg.comfPassword = "Passwords don't match";
        data.errorMsg.yn = 1;
    }
    if (data.errorMsg.yn != 1) {

        let user = new customers({
            email: data.userInfo.email,
            firstName: data.userInfo.name,
            lastName: data.userInfo.lname,
            phone: data.userInfo.phone,
        })
        bcrypt.hash(data.userInfo.password, 10).then((hash) => {
            user.password = hash;
            console.log(user.password)
            user.save()
                .then(user => {
                    const names = user.firstName + " " + user.lastName
                    res.render("dashboard", { stuff: names, layout: "main2" });
                })
                .catch(error => {
                    console.log(error)
                })
        })

    }

    else {
        res.render("registration", { data: data, layout: "main" });
    }
});

app.listen(port);
