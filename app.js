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
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

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
    password: String,
    googleId: String
});

//Hashing and Salting the password
userSchema.plugin(passportLocalMongoose);
/* Simple plugin for Mongoose which adds a findOrCreate 
method to models. This is useful for libraries like Passport 
which require it. */
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

//Use passport-local-mongoose to create a local login strategy 
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user);
  });
   
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

//Level 6 - OAuth 2.0 & Sign In with Google
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
    res.render("home");
});

app.get("/auth/google", passport.authenticate("google", {
    scope: ["profile"]
}));

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
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