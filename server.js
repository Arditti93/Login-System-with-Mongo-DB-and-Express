const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const User = require('./models/user');
const bcrypt = require("bcryptjs");
const cookiePaser = require("cookie-parser");
const jwt = require('jsonwebtoken'); 
const auth = require('./middleware/auth');

const user = require('./models/user');
const { exists } = require('./models/user');

const app = express(); 

dotenv.config( { path: './.env' } );
// connect to mongo
mongoose.connect( process.env.DB_URL , {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
})

.then( () => console.log("MongoDB is connected"))

const viewsPath = path.join(__dirname, '/views'); 
const publicDirectory = path.join(__dirname, '/public');

app.use(express.static(publicDirectory));
app.set('views', viewsPath);
app.set('view engine', 'hbs');

app.use(express.urlencoded() );
app.use(express.json() );
app.use(cookiePaser () ); 
app.use(express.static('views/images')); 


// app.get('*', (req,res)=>{
//         res.send("sorry this page  doesn't exists")
// });


app.get("/", (req, res) =>{
        res.render("index");
}) 


app.get("/register", (req, res) =>{
        res.render("register");
})

app.post("/getFormValues", async (req, res) =>{ 
        const usernameCheck = await User.find({email: req.body.userEmailForm})
        const hashedPassword1 = await bcrypt.hash(req.body.userPasswordForm, 8);
        const hashedPassword2 = await bcrypt.hash(req.body.userPasswordForm2, 8);
        // console.log(hashedPassword)

    if(usernameCheck.length > 0) {
            res.redirect("/register")
    }
    else{
        await User.create({
            name: req.body.userNameForm,
            email: req.body.userEmailForm,
            password: hashedPassword1,
            passwordcheck: hashedPassword2 
        })
        res.render("login");
    }
})

app.get("/login", (req, res) => {
        res.render("login");
}); 

app.post("/login",async (req,res) => {
        // console.log(req.body.userEmail);
        // console.log(req.body.userPassword);
        //checks if user exists in database with await 
        // .find grabs values from database with email objects
        const user = await User.find({ email: req.body.userEmail })
        console.log(user);
        //.length finds user in database 
        if(user.length > 0) {
            //if inputted password matches hashed password on database
            const isMatch = await bcrypt.compare(req.body.userPassword, user[0].password)
        //     console.log(isMatch);
            if(isMatch) {
                //creates token
                const token = jwt.sign( {id: user[0]._id}, process.env.JWT_SECRET, { 
                    expiresIn: process.env.JWT_EXPIRES_IN
                });
                console.log("my token");
                console.log(token);
                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                }
                res.cookie('jwt', token, cookieOptions);
        
                const admin = await User.find({admin: true})
                console.log("this is admin")
                console.log(admin)
                const adminCheck = await User.find({email: req.body.userEmail})
                console.log("this is admin check")
                console.log(adminCheck)

                if(adminCheck[0].admin) {
                        res.redirect("/adminProfile")
                }
                else {
                        res.render("welcome", {
                               nUser: user 
                        })
                }
            }
            //if match returns false
            else{
                res.send("sorry your email or password is wrong");
            }
         //if user isn't found- sends to font end
        }
        else {
            res.send("sorry your email or password is wrong")
        }
    })

app.get("/Welcome/:_id", auth.isLoggedIn, async(req, res) =>{
        const update = req.params._id
        const userLoggedIN = await User.find({
                _id: update
        })
        if(req.user) {
                res.render("Welcome",{ 
                nUser: userLoggedIN 
                });
        }
        else{
                res.redirect("/login")
        }
}) 

app.get("/userProfile/:_id", auth.isLoggedIn, async(req, res) =>{
        const update = req.params._id
        const userLoggedIN = await User.find({
                _id: update
        })
        if(req.user) {
                res.render("userProfile",{ 
                        nUser: userLoggedIN 
                });
        }
        else {
                res.redirect("/login")
        }
}) 

app.post("/userProfile/:_id", auth.isLoggedIn, async(req, res) => {
        const update = req.params._id
        const userLoggedIN = await User.findById({
                _id: update
        })
        if (req.user) {
            res.render("userProfile", {
                nUser: userLoggedIN
            })
        }
        else{
            res.redirect("/login")
        }
}); 

app.post("/updateNUser/:_id", async(req, res) => {
        const update = req.params._id
        const hashedPassword = await bcrypt.hash(req.body.updatePasswordForm, 8);
        await User.findByIdAndUpdate(update, {
                email: req.body.updateEmailForm,
                password: hashedPassword
        });
        res.render("login")
}) 
app.post("/logout", auth.logout, (req, res) =>{
        res.redirect("/login")
    })


app.get("/adminProfile", auth.isLoggedIn, async(req, res) => {
        const allUsers = await user.find()
        if(req.user) {
                res.render('adminProfile', {
                        regUsers: allUsers
                }) 
        }
        else{
                res.redirect("/login")
            }
}) 

app.post("/delete/:_id", async(req, res)=> {
        const update = req.params._id
        await User.findByIdAndDelete({
                _id: update
        })
                res.redirect('/adminProfile')
}) 


app.get("/update/:_id", async (req, res) => {
        const update = req.params._id
        const updateUser = await User.find({
                _id: update
        })
        res.render('updateAllUsers', {
                parsedUser: updateUser
        })
})


app.post("/updateUser/:_id", async(req, res) => {
        const update = req.params._id
        const hashedPassword = await bcrypt.hash(req.body.updatePasswordForm, 8);
        await User.findByIdAndUpdate(update, {
                name: req.body.updateNameForm,
                email: req.body.updateEmailForm,
                password: hashedPassword
        });
        res.redirect('/adminProfile')
}) 

    
app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`)
})

