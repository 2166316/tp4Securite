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

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
    secret: 'your-secret-key', 
    resave: false,
    saveUninitialized: false,
    nbDeCallDisponible:3
}));  

app.set('view engine', 'ejs');

//folder de views
app.set('views', path.join(__dirname, 'views'));

//sert le css 
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    console.log(req.body)

    if (req.session.nbDeCallDisponible === undefined) {
        req.session.nbDeCallDisponible = 3; 
    } else {
       // req.session.nbDeCallDisponible--; 
    }
    console.log(req.session.nbDeCallDisponible);
    next(); 
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
            console.log(results.length)

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
                console.log(user);
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
                        console.log("200:");
                        console.log(loginstr);
                        console.log(passwordstr);
                        console.log("-");
                        
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
    console.log(req.body)
    let { username, password } = req.body;
    let loginstr = username ;
    let passwordstr = password ;
    console.log(passwordstr)
    console.log(loginstr)
    bcrypt.hash( passwordstr, 12, (err1, hash) => {
        if (err1) {
          console.error(err1);
          return;
        }
        con.query("INSERT INTO tp4securite.utilisateur (login, mot_de_passe) VALUES ( ?, ?)", [loginstr, hash], (err2, result) => {
            if (err2) {
                var error = err2;
                console.log(error)
                const jsonfilePath = path.join(__dirname, 'index.html');
    
                fs.readFile(jsonfilePath,'utf8', (err2, html) => {
                    if (err2) {
                        console.error('Error reading file:', err2);
                        res.send('Internal Server Error');
                    }
                    let htmlmodifie = html.replace("<!-- INSERT_MESSAGE_HERE -->",error);
                    res.send(htmlmodifie);
                });
            }else{
                res.send("REGISTERED");
            }
        });
      });
});

/*app.post('/login', (req, res) => {
    console.log(req.session.nbDeCallDisponible);
    req.session.nbDeCallDisponible = (req.session.nbDeCallDisponible - 1 );

    console.log(req.body);
    return res.status(200).end();
    /*const { username, password } = req.body;
    let loginstr = username ;
    let passwordstr = password ;
    con.query("SELECT * FROM tp4securite.utilisateur WHERE login = ?", [loginstr], (err, results, fields) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        }
        
        if (results.length === 0) {
            return res.status(404).send("User not found");
        }

        const user = results[0]; 
        let pass = user.mot_de_passe;
        //console.log(loginstr);
        //console.log(passwordstr);
        //console.log(pass);
        bcrypt.compare(passwordstr, pass, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Internal Server Error");
            }
            
            if (result) {
                console.log("200:");
                console.log(loginstr);
                console.log(passwordstr);
                console.log("-");
                return res.status(200).send("Login successful");
            } else {
     
                return res.status(401).send("Invalid username or password");
            }
        });
    });*/
/*});*/


app.listen(3001, () => {
    console.log('Serveur en écoute sur le port 3001');
});




//const users = [];

    /*con.query("SELECT * FROM tp4securite.utilisateur", (err, result, fields) => {
        if (err) {
            res.status(500).json({ error: 'An error occurred' });
            return;
        }
        result.forEach(row => {
            const u = new User(row.login, row.mot_de_passe);
            users.push(u);
        });


        let found = false;
        let otherUser = null;
        users.forEach(u =>{
            if(u.username == user.username && u.password == user.password){
                found = true;
                return;
            }
            if(u.password == user.password){
                otherUser = u.username;
            }
        });

        console.log(__dirname  + '/public');
        if(found){
            res.status(200).send("CONNECTED");
        }else{
            var error = 'ERROR'
            const jsonfilePath = path.join(__dirname, 'index.html');

            fs.readFile(jsonfilePath,'utf8', (err, html) => {
                if (err) {
                    console.error('Error reading file:', err);
                    res.status(500).send('Internal Server Error');
                }
                let htmlmodifie = html.replace("<!-- INSERT_MESSAGE_HERE -->",error);
                res.send(htmlmodifie);
            });
          
        }
    });/*const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max requests per window
    message: 'Too many requests from this IP, please try again later',
    
});

app.use('/', limiter);*/

/*app.use(session({
    genid: function(req) {
      return genuuid() // use UUIDs for session IDs
    },
    secret: 'keyboard cat'
}))*/

//var passwordGen = require('./passwordgenerator');

//app.use(express.static("img"));
//app.use(bodyParser.urlencoded({ extended: false }));

/*app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


app.get("/genpasswords",(req, res) => {
    passwordGen.password3LettreMinuscule();
    res.sendStatus(200);
})/*app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


app.get("/genpasswords",(req, res) => {
    passwordGen.password3LettreMinuscule();
    res.sendStatus(200);
})**/