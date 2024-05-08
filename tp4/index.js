const mysql = require("mysql2");
const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const bodyParser = require('body-parser');
var app = express();

const fs = require("fs");


app.use(express.static("img"));
app.use(bodyParser.urlencoded({ extended: false }));


var con = mysql.createConnection({
    host: "tp2-database-cegeplimoilou-d98e.aivencloud.com",
    port: 13923,
    user: "avnadmin",
    password: "AVNS_wB7IDMVSHeaD3M5nu0J", 
})
  
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    con.query("SELECT * FROM tp4securite.utilisateur WHERE login = ?", [toString(username)], (err, results, fields) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        }
        
        if (results.length === 0) {
            return res.status(404).send("User not found");
        }

        const user = results[0]; 
        
        bcrypt.compare(toString(password), toString(user.mot_de_passe), (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Internal Server Error");
            }
            
            if (result) {
  
                return res.status(200).send("Login successful");
            } else {
     
                return res.status(401).send("Invalid username or password");
            }
        });
    });
});


app.listen(3000, () => {
    console.log('Serveur en écoute sur le port 3000');
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
    });*/