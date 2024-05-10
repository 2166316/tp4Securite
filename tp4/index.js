const mysql = require("mysql2");

const express = require("express");

const path = require("path");

const bcrypt = require("bcrypt");

const bodyParser = require('body-parser');

const fs = require("fs");
//const rateLimit = require('express-rate-limit');

const session = require("express-session")

require('dotenv').config();

//const { CaptchaJs } = require("@solarwinter/captchajs");
//const captcha = new CaptchaJs({ client: process.env.CAPTCHAS_CLIENT, secret: process.env.CAPTCHAS_SECRET });

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

function genererCodeTemp() {
    const caracteres = '0123456789';
    const longueur = 6;
    let motDePasse = '';
  
    for (let i = 0; i < longueur; i++) {
      const randomIndex = Math.floor(Math.random() * caracteres.length);
      motDePasse += caracteres[randomIndex];
    }
  
    return motDePasse;
}

function sauvegarderCodeTemporaire(nomUtilisateur) {
    const code = genererCodeTemp();
    const maintenant = new Date();
    const dateCreation = maintenant.toISOString().replace(/:/g, '.').replace(/T/g, '-').split('.')[0];
    const nomFichier = `${nomUtilisateur}_${dateCreation}.txt`;

    const cheminFichier = path.join(__dirname, 'public', nomFichier);
    const expiration = new Date(maintenant.getTime() + 15 * 60000);

    let fichierExist = false;
    const contenuFichier = `Code temporaire: ${code}\nValide jusqu'à: ${expiration}`;
    
    fs.writeFile(cheminFichier, contenuFichier, (err) => {
      if (err) {
        console.error('Erreur lors de la sauvegarde du code temporaire : ', err);
      } else {
        console.log('Code temporaire sauvegardé avec succès dans : ', cheminFichier);
      }
    });
    return cheminFichier;
}

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

app.get('/connected', (req, res)=>{
    res.render('connected');
})

app.get('/a2f',(req,res)=>{
    res.render('a2f');
})

app.post('/confirmeA2F', (req, res)=> {
    const { code } = req.body;
    const cheminFichier = req.session.cheminFichier;
    console.log(cheminFichier);
    fs.readFile(cheminFichier, 'utf8', (err, data) => {
        if (err) {
          console.error('Erreur lors de la lecture du fichier : ', err);
          return;
        }
    

    const lignes = data.split('\n');
    const codeTemporaire = lignes[0].split(': ')[1];
    console.log(codeTemporaire);

    if (code === codeTemporaire) {
        console.log('Validation réussie ! Vous êtes connecté.');
        res.redirect('connected');
      } else {
        console.log('Code de validation incorrect. Veuillez réessayer.');
        res.redirect('nope');
      }
    });

});

app.post('/login', (req, res) => {
    if(req.session.nbDeCallDisponible<=0){
        //const random = captcha.getRandomString();
        //marche pas le register ne veut pas me répondre
        //const imageUrl = captcha.getImageUrl({ randomString: random });

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
                    console.log(result);
                    if (result) {
                        //console.log("200:");
                        //console.log(loginstr);
                        //console.log(passwordstr);
                       // console.log("-");
                        req.session.cheminFichier = sauvegarderCodeTemporaire(username);
                        res.redirect('a2f');
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
        //const random = captcha.getRandomString();
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
    //Abc123@#$%
    
    con.query("SELECT * FROM tp4securite.utilisateur", (err, results, fields) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error occurred while fetching user data.");
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