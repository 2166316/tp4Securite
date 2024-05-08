const mysql = require("mysql2");

const express = require("express");

const path = require("path");

const bcrypt = require("bcrypt");

const bodyParser = require('body-parser');

const fs = require("fs");
//const rateLimit = require('express-rate-limit');

const session = require("express-session")

require('dotenv').config();

const { CaptchaJs } = require("@solarwinter/captchajs");
const captcha = new CaptchaJs({ client: process.env.CAPTCHAS_CLIENT, secret: process.env.CAPTCHAS_SECRET });

var app = express();

var bannedIps = [];

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
    secret: 'your-secret-key', 
    resave: false,
    saveUninitialized: false,
    nbDeCallDisponible:3
}));  

function ramIps(){
    let ipfile = path.join(__dirname, 'ip.txt')
    fs.readFile(ipfile, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        bannedIps = data.split(/\r?\n/);

        /*for(let ip of bannedIps){
            console.log(ip);
        }*/
        console.log(bannedIps.length);
    });
}

//en ram les ips 
ramIps();

app.set('view engine', 'ejs');

//folder de views
app.set('views', path.join(__dirname, 'views'));

//sert le css 
app.use(express.static(path.join(__dirname, 'public')));


app.use((req, res, next) => {
    //console.log((req.ip));
    //validation
    let ip = req.ip.replace(":","");
    ip = ip.replace("::","");
    ip = ip.replace(":","");
    ip = ip.replace(":","");
    ip = ip.replace("ffff","");

    //console.log((ip));
    if(bannedIps.includes(ip)){
        res.render('nope');
    }else{
        if (req.session.nbDeCallDisponible === undefined) {
            req.session.nbDeCallDisponible = 3; 
        } else {
           // req.session.nbDeCallDisponible--; 
        }
        console.log(req.session.nbDeCallDisponible);
        next(); 
    }
});

//bd
var con = mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "", 
})

app.get('/', (req, res) => {
    const data = {
        title: 'Connexion',
        message:""
    };
    res.render('index', data);
    
});

app.post('/login', (req, res) => {
    if(req.session.nbDeCallDisponible<=0){
        const random = captcha.getRandomString();
        //marche pas le register ne veut pas me répondre
        const imageUrl = captcha.getImageUrl({ randomString: random });

        res.render('indexcapchat', { imageUrl });
    }
    else{
        const { username, password } = req.body;
        let loginstr = username ;
        let passwordstr = password ;
        
       // console.log(pass);
        con.query("SELECT * FROM tp4securite.utilisateur WHERE login = ?", [loginstr], (err, results, fields) => {
            if (err) {
                console.error(err);
                const data = {
                    title: 'Connexion',
                    message:"error"
                };
                res.render('index', data);
            }
            //console.log(results.length)

            const user = [];
            let pass = "";
            if (results.length === 0) {
                req.session.nbDeCallDisponible--; 
                const data = {
                    title: 'Connexion',
                    message:"error"
                };
                res.render('index', data);
            }else{

                user.push(results[0]); 
               // console.log(user);
                pass = user[0].mot_de_passe+"";
                
                 bcrypt.compare(passwordstr, pass, (err, result) => {
                    if (err) {
                        console.error(err);
                        const data = {
                            title: 'Connexion',
                            message:"error"
                        };
                        return res.render('index', data);
                    }
                    
                    if (result) {
                        //console.log("200:");
                        //console.log(loginstr);
                        //console.log(passwordstr);
                       // console.log("-");
                        
                        return res.render('connected');
                    } else {
                        req.session.nbDeCallDisponible--; 
                        const data = {
                            title: 'Connexion',
                            message:"error"
                        };
                        return res.render('index', data);
                    }
            });
            }
    });
    }
});
  
app.post('/capchatverif', (req, res) => {
    //console.log(req.body);
    if(req.body.captchaPassword == "abc"){
        const data = {
            title: 'Connexion',
            message:""
        };
        req.session.nbDeCallDisponible = 3; 
        res.render('index',data);
    }else{
        const random = captcha.getRandomString();
        //marche pas le register ne veut pas me répondre
        const imageUrl = captcha.getImageUrl({ randomString: random });

        res.render('indexcapchat', { imageUrl });
    } 
});

app.post('/register', (req, res) => {
    let { username, password } = req.body;
    let loginstr = username;
    let passwordstr = password;

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[%&$!#@])[a-zA-Z\d%&$!#@]{10,}(?:(.)\1{2,})?$/;
    
    con.query("SELECT * FROM tp4securite.utilisateur", (err, results, fields) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error occurred while fetching user data.");
        }

        if (results.length === 0) {
            return res.render('index', { title: 'Connexion', message: "No users found." });
        }

        if (passwordRegex.test(passwordstr) === false ) {
            return res.render('index', { title: 'Connexion', message: "Le password doit être plus de 10 lettres/nombres" });
        } else {
            bcrypt.hash(passwordstr, 12, (err1, hash) => {
                if (err1) {
                    console.error(err1);
                    return res.status(500).send("Error occurred while hashing password.");
                }
                
                con.query("INSERT INTO tp4securite.utilisateur (login, mot_de_passe) VALUES (?, ?)", [loginstr, hash], (err2, result) => {
                    if (err2) {
                        console.error(err2);
                        return res.status(500).send("Error occurred while inserting user data.");
                    }

                    return res.render('index', { title: 'Connexion', message: "Registered avec succès" });
                });
            });
        }
    });
});


app.listen(3001, () => {
    console.log('Serveur en écoute sur le port 3001');
});