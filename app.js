require('dotenv').config()
const express = require('express');
const ejs = require("ejs");
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportLocalMongoose = require('passport-local-mongoose');
const { log } = require('console');
// const upload = require('express-fileupload');
// const fs = require('fs');
// const multer = require('multer');

/* Server Starter Code */
const app = express();

// let port = process.env.PORT;
let port = 3000;

app.listen(port);

/* Prerequistes */
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(express.json());
// app.use(upload());
app.use(session({
    secret: "44t4 b453 15 53cur3d",
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use((req,res,next)=>{
    next();
  });

/* Bcrypt */
const saltRounds = 10;



/* MongoDB and Mongoose configurations */
const mongoPort = process.env.MONGO_PORT;
mongoose.connect(mongoPort,{useNewUrlParser:true,useUnifiedTopology:true,useFindAndModify:false},()=>console.log("Database connected"));
mongoose.set("useCreateIndex", true);

/* Schema and Model*/
const studentSchema = new mongoose.Schema({
    uid: String,
    password: String,
    name: String,
    admissionYear: Number,
    dob: String,
    blood: String,
    gender: String,
    course: String,
    type: String,
    cpp: [{
        marks: String,
        grade: String,
        attendance: String
    }],
    dbms: [{
        marks: String,
        grade: String,
        attendance: String
    }],
    web: [{
        marks: String,
        grade: String,
        attendance: String
    }]
},{ collection:'students',
    versionKey: false
});
const staffSchema = new mongoose.Schema({
    uid: String,
    password: String,
    name: String,
    dob: String,
    gender: String,
    department: String
},{ collection:'staffs',
    versionKey: false
});
const helpSchema = new mongoose.Schema({
    uid: String,
    type: String,
    description: String
},{
    collection: 'helps',
    versionKey: false
});

const adminSchema = new mongoose.Schema({
    username : String,
    password : String
});


studentSchema.plugin(passportLocalMongoose);
staffSchema.plugin(passportLocalMongoose);
adminSchema.plugin(passportLocalMongoose);

const Student = mongoose.model("Student",studentSchema);
const Staff = mongoose.model("Staff",staffSchema);
const Help = mongoose.model("Help",helpSchema);
const Admin = mongoose.model("Admin",adminSchema);

passport.use(Student.createStrategy());
passport.use(Staff.createStrategy());
passport.use(Admin.createStrategy());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// const adminPassword = "im@secured0001";
// bcrypt.hash(adminPassword , saltRounds , (err,hash)=>{
//     if(!err){
//         const newAdmin = new Admin({
//             username: "admin",
//             password: hash
//         });
//         newAdmin.save((err)=>{
//             if(err){
//                 console.log(err);
//             }
//         })
//     }else{
//         console.log(err);
//     }
// });


/* ************************* Express Routes *************************** */


//   A C A D E M I C S


app.route("/academics")
.get((req,res)=>{
    if(req.isAuthenticated() && req.session.type === 'student'){
        Student.findOne({uid : req.session.username}, (err,foundStudent)=>{
            if(!err){
                res.render("Academics",{student: foundStudent});
            }
        });
    }else{
        res.redirect("/student");
    }
});


//   A D M I N   R O U T E


app.route("/admin")
.get((req,res)=>{
    if(req.session.type === 'admin'){
        Help.find({},(err,foundHelp)=>{
            res.render("AdminPanel",{helpList: foundHelp});
        })
    }else{
        res.render("Admin", {status: ""});
    }
})
.post((req,res)=>{
    const username = req.body.username;
    const password = req.body.password;

    Admin.findOne({username: username},(err,foundAdmin)=>{
        if(err){
            res.render("Admin",{status: "User Not Found"});
        }else{
            if(foundAdmin){
                bcrypt.compare(password ,foundAdmin.password,(err,result)=>{
                    if(err){
                        res.render("Admin",{status: "Error"})
                    }else{
                        if(result){
                            passport.authenticate('local');
                            req.session.username = foundAdmin.username;
                            req.session.type = 'admin';
                            res.redirect("/adminpanel"); 
                        }else{
                            res.render("Admin",{status: "Wrong Password"})
                        }
                    }
                });
            }else{
                res.render("Admin",{status: "User doesn't exist"});
            }
        }
    });
});


//   A D M I N   P A N E L 


app.route("/adminpanel")
.get((req,res)=>{
    if(req.session.type === 'admin'){
    Admin.findOne({username: req.session.username},(err,foundAdmin)=>{
        if(!err){
            Help.find({},(err,foundHelp)=>{
                res.render("AdminPanel",{helpList: foundHelp});
            })
        }else{
            console.log(err);
        }
    });
}else{    
    res.redirect("/admin");
    }
});


//   C A M P U S

app.route("/campus")
.get((req,res)=>res.render("Campus"));


//   H E L P

app.route("/help")
.get((req,res)=>res.render("Help"))
.post((req,res)=>{
    const uid = req.body.uid;
    const type = req.body.role;
    const description = req.body.details;

    const newHelp = new Help({
        uid: uid,
        type: type,
        description: description
    });

    newHelp.save((err)=>{
        if(!err){
            res.redirect("/");
        }else{
            console.log(err);
            res.redirect("/");
        }
    });
});


//  H O L I D A Y S


app.route("/holidays")
.get((req,res)=>res.render("Holidays"));


//  H O M E 


app.route("/")
.get((req,res)=> res.render("Home"));


//  L I S T S - for admin view


app.get("/studentlist",(req,res)=>{
    if(req.session.type === 'admin'){
        Student.find({},(err,foundStudent)=>{
            res.render("StudentList",{studentList : foundStudent});
        });
    }else{
        res.redirect("/admin");
    }
});
app.get("/stafflist",(req,res)=>{
    if(req.session.type === 'admin'){
        Staff.find({},(err,foundStaff)=>{
            res.render("StaffList",{staffList : foundStaff});
        });
    }else{
        res.redirect("/admin");
    }
});


//  L O G O U T


app.get("/logout",(req,res)=>{
    req.session.destroy((err) => {
        res.redirect('/');
      })
});


//   P G  -  C O U R S E S


app.route("/pg-courses")
.get((req,res)=>res.render("PG-Course"));


//  S P O R T S


app.route("/sports")
.get((req,res)=>res.render("Sports"));


//  S T A F F 


app.route("/staff")
.get((req,res)=>{
    if(req.isAuthenticated() && req.session.type === 'staff'){
        Staff.findOne({uid : req.session.username}, (err,foundStaff)=>{
            if(!err){
                res.render("StaffDashboard",{staff: foundStaff});
            }else{
                console.log(err);
            }
        })
    }else{
        res.render("Staff",{status: ''});
    }
})
.post((req,res)=>{
    const username = req.body.username;
    const password = req.body.password;

    Staff.findOne({uid:username}, (err,foundStaff)=>{
        if(err){
            res.render("Staff",{status:"Some Error"});
        }else{
            if(foundStaff){
                bcrypt.compare(password, foundStaff.password, (err, result)=> {
                    if(err){
                        res.render("Staff",{status:"Some error"});
                    }else if(result){
                        req.login(foundStaff,(err)=> {
                        if (err) { 
                            console.log(err); 
                        }else{
                            passport.authenticate("local");
                            req.session.username = foundStaff.uid;
                            req.session.type = 'staff';
                            res.redirect('/staffdashboard');
                        }
                      });
                    }else{
                        res.render("Staff",{status:"Wrong Password"});
                    }
                });
            }else{
                res.render("Staff",{status:"User doesn't exist"});
            }
        }
    });
});


//  S T A F F  -  D A S H B O A R D 


app.route("/staffdashboard")
.get((req,res)=>{
    if(req.isAuthenticated() && req.session.type === 'staff'){
        Staff.findOne({uid : req.session.username}, (err,foundStaff)=>{
            if(!err){
                res.render("StaffDashboard",{staff: foundStaff});
            }else{
                console.log(err);
            }
        })
    }else{
        res.redirect("/staff");
    }
});

//  S T A F F  -  R E G I S T R A T I O N


app.route("/staffregistration")
.get((req,res)=>{
    res.render("StaffRegistration");
})
.post((req,res)=>{
    const uid = req.body.uid;
    const name = req.body.name;
    const dob = req.body.dob;
    dob.slice(0,10);
    const gender = req.body.gender;
    const department = req.body.department;


    bcrypt.hash(req.body.password, saltRounds, function(err, hash){
        if(!err){
            const newStaff = new Staff({
                uid: uid,
                password: hash,
                name: name,
                dob: dob,
                gender: gender,
                department: department
            });

            newStaff.save((err)=>{
                if(!err){
                    res.render("Successful");
                }else{
                    console.log("err in saving " + err);
                    res.redirect("/staffregistration");
                }
            });
        }else{
            console.log("err " + err);
        }
    });
});


//  S T U D E N T


app.route("/student")
.get((req,res)=>{
    if(req.isAuthenticated() && req.session.type === 'student'){
        Student.findOne({uid: req.session.username}, (err,foundStudent)=>{
            if(!err){
                console.log(foundStudent);
                res.render("StudentDashboard",{student: foundStudent});
            }else{
                console.log(err);
            }
        })
    }else{
        res.render("Student",{status: ''});
    }
})
.post((req,res)=>{
    const username = req.body.username;
    const password = req.body.password;

    Student.findOne({uid:username}, (err,foundStudent)=>{
        if(err){
            res.render("Student",{status:"Some Error"});
        }else{
            if(foundStudent){
                bcrypt.compare(password, foundStudent.password, (err, result)=> {
                    if(err){
                        res.render("Student",{status:"Some error"});
                    }else if(result){
                        req.login(foundStudent,(err)=> {
                        if (err) { 
                            console.log(err); 
                        }else{
                            passport.authenticate("local");
                            req.session.username = foundStudent.uid;
                            req.session.type = 'student';
                            res.redirect('/studentdashboard');
                        }
                      });
                    }else{
                        res.render("Student",{status:"Wrong Password"});
                    }
                });
            }else{
                res.render("Student",{status:"User doesn't exist"});
            }
        }
    });
});


//  S T U D E N T  -  D A S H B O A R D


app.route("/studentdashboard")
.get((req,res)=>{
    if(req.isAuthenticated() && req.session.type === 'student'){
        Student.findOne({uid: req.session.username}, (err,foundStudent)=>{
            if(!err){
                res.render("StudentDashboard",{student: foundStudent});
            }else{
                console.log(err);
            }
        })
    }else{
        res.redirect("/student");
    }
});


//  S T U D E N T  -  D A T A 


app.route("/studentdata")
.get((req,res)=>{
    if(req.isAuthenticated() && req.session.type === 'staff'){
        Staff.findOne({uid : req.session.username}, (err,foundStaff)=>{
            if(!err){
                Student.find({},(err,found)=>{
                    res.render("StudentData",{staff: foundStaff,student: found});
                })
                
            }else{
                console.log(err);
            }
        })
    }else{
        res.redirect("/staff");
    }
});


// S T U D E N T  -  R E G I S T R A T I O N


app.route("/studentregistration")
.get((req,res)=>{
    if(req.isAuthenticated() && req.session.type === 'staff'){
        res.render("StudentRegistration");
    }else{
        res.redirect('/staff');
    }
})
.post((req,res)=>{
    const uid = req.body.uid;
    const name = req.body.name;
    const admissionYear = req.body.admissionYear;
    const dob = req.body.dob;
    dob.slice(0,10);
    const blood = req.body.blood;
    const gender = req.body.gender;
    const course = req.body.course;
    const type = 'student';

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        if(!err){
            const newStudent = new Student({
                uid: uid,
                password: hash,
                name: name,
                admissionYear: admissionYear,
                dob: dob,
                blood: blood,
                gender: gender,
                course: course,
                cpp: [{
                    marks: '100',
                    grade: 'A+',
                    attendance: '100'
                }],
                web: [{
                    marks: '95',
                    grade: 'A+',
                    attendance: '100'
                }],
                dbms: [{
                    marks: '95',
                    grade: 'A+',
                    attendance: '100'
                }]
            });

            newStudent.save((err)=>{
                if(!err){
                    res.render("Successful");
                }else{
                    console.log(err);
                    res.redirect("/studentregistration");
                }
            });
        }else{
            console.log(err);
        }
    });
});


//   S U B J E C T S - for subject details


app.post("/cpp",(req,res)=>{
    const marks = req.body.marks;
    const attendance = req.body.attendance;
    const grade = req.body.grade;
    const val = req.body.uid;

    Student.findOne({uid:val},(err,foundStudent)=>{
        console.log(foundStudent.cpp[0].marks);
        if(!err){
            foundStudent.cpp[0].marks = marks;
            foundStudent.cpp[0].grade = grade;
            foundStudent.cpp[0].attendance = attendance;
        }
        foundStudent.save((err)=>{
            if(!err){
                res.redirect("/studentdata");
            }else{
                console.log(err);
                res.redirect("/staffdashboard");
            }
        });
    });
});
app.post("/web",(req,res)=>{
    const marks = req.body.marks;
    const attendance = req.body.attendance;
    const grade = req.body.grade;
    const val = req.body.uid;

    console.log(marks + " " + attendance + " " + grade+ " "+val);

    Student.findOne({uid:val},(err,foundStudent)=>{
        if(!err){
            foundStudent.web[0].marks = marks;
            foundStudent.web[0].grade = grade;
            foundStudent.web[0].attendance = attendance;
        }
        foundStudent.save((err)=>{
            if(!err){
                res.redirect("/studentdata");
            }else{
                console.log(err);
                res.redirect("/staffdashboard");
            }
        });
    });
});
app.post("/dbms",(req,res)=>{

    const marks = req.body.marks;
    const attendance = req.body.attendance;
    const grade = req.body.grade;
    const val = req.body.uid;

    Student.findOne({uid:val},(err,foundStudent)=>{
        if(!err){
            foundStudent.dbms[0].marks = marks;
            foundStudent.dbms[0].grade = grade;
            foundStudent.dbms[0].attendance = attendance;
        }
        foundStudent.save((err)=>{
            if(!err){
                res.redirect("/studentdata");
            }else{
                console.log(err);
                res.redirect("/staffdashboard");
            }
        });
    });
});


//  S U C C E S S F U L


app.get("/successful",(req,res)=>{
    res.render('/');
});


//   U G  -  C O U R S E S


app.route("/ug-courses")
.get((req,res)=>res.render("UG-Course"));


/* ********************* EXTRA CODES ******************* */


//   A S S I G N M E N T


// app.post('/cppassignment',(req,res)=>{
//     const dir = __dirname + '/public/Uploads/' + req.session.username;
//     console.log("Username : " +req.session.username);
//         if (!fs.existsSync(dir)){
//             fs.mkdirSync(dir);
//         }
//     const currentDir = dir + "/";
//         if(req.files){
//             console.log("File : " + req.files.file);
//             var file = req.files.file;
//             console.log("File : " + file);
//             var filename = file.name;
//             console.log("Current directory : " + currentDir);

//             file.mv(currentDir , filename , (err)=>{
//                 if(err){
//                     res.redirect("/academics");
//                 }else{
//                     res.render("Successful");
//                 }
//             })
//         }
// })
// app.post('/webassignment',(req,res)=>{
//     const dir = __dirname + '/public/Uploads/' + req.session.username;
//         if (!fs.existsSync(dir)){
//             fs.mkdirSync(dir);
//         }
//     const currentDir = dir + "/";
//         if(req.files){
//             var file = req.files.files.file;
//             var filename = file.name;
//             console.log(filename);
//         }

//     res.redirect("/academics");
// })
// app.post('/dbmsassignment',(req,res)=>{
//     const dir = __dirname + '/public/Uploads/' + req.session.username;
//         if (!fs.existsSync(dir)){
//             fs.mkdirSync(dir);
//         }
//     const currentDir = dir + "/";
//         if(req.files){
//             var file = req.files.files.file;
//             var filename = file.name;
//             console.log(filename);
//         }
//         res.redirect("/academics");
// })