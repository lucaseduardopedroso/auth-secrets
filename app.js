//jshint esversion:6
//Environment Variables to Keep Secrets Safe
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { MongoTopologyClosedError } = require("mongodb");
//Cookies & Sessions
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');

//Level 5 - Using Passport.js to Add Cookies and Sessions
//Use session package
app.use(session({
    //Initial config
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

//Use passport package
app.use(passport.initialize());
//Use passport to deal with session
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

//Hashing and Salting the password
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

//Use passport-local-mongoose to create a local login strategy 
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/secrets", function(req, res){
    // Test if request is authenticated
    if (req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res){
    //Logout method comes from passport
    req.logout();
    res.redirect("/");
});

app.post("/register", function(req, res){

    //Register method comes from the passport-local-mongoose
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function(err, user){
                res.redirect("/secrets");
            });
        }
    });

});

app.post("/login", function(req, res){
    
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    //Login method comes from passport
    req.login(user, function(err){
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.listen(3000, function(){
    console.log("Server started on port 3000");
});