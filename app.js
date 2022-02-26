//jshint esversion:6
//Environment Variables to Keep Secrets Safe
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { MongoTopologyClosedError } = require("mongodb");
const app = express();
/* const encrypt = require("mongoose-encryption"); */
const md5 = require("md5");

const bcrypt = require("bcrypt");
// Bcrypt salting
const saltRounds = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

/* // Level 2 - Database Encryption
userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]}); */

const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res){
    // Level 4 - Salting and Hashing Passwords with bcrypt
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        
        //Level 1 - Register Users with Username and Password
    const newUser = User({
        email: req.body.username,
        /* // Level 3 - Hashing Passwords
        password: md5(req.body.password) */
        password: hash
    });

    newUser.save(function(err){
        if(!err){
            //Only render the "secrets" page when the user is logged in
            res.render("secrets");
        } else {
            console.log(err);
        }
    });

    });
});

app.post("/login", function(req, res){
    const username = req.body.username;
   /*  //Hashing Passwords
    const password = md5(req.body.password); */
    const password = req.body.password;

    //Level 1
    User.findOne({email: username}, function(err, foundUser){
        if(err){
            console.log(err);
        } else {
            if(foundUser){
                // Level 4 - Load hash from your password DB.
                bcrypt.compare(password, foundUser.password, function(err, result) {
                    if(result === true){
                        res.render("secrets");
                    }
                });
            }
        }
    });
});

app.listen(3000, function(){
    console.log("Server started on port 3000");
});