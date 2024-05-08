var express = require('express');
var path = require('path');
var router = express.Router();
var fs = require("fs");

function password3LettreMinuscule(){

    let combinations = [];
    for (let i = 97; i <= 122; i++) {
        for (let j = 97; j <= 122; j++) {
            for (let k = 97; k <= 122; k++) {
                let pass = String.fromCharCode(i) + String.fromCharCode(j) + String.fromCharCode(k);
                combinations.push(pass);
            }
        }
    }

    let filepath = path.join(__dirname, 'passwords.txt');
    let data = combinations.join('\n');
   
    fs.truncate(filepath,(err)=>{
    if(err){
        console.log("error pass écrit: "+err);
        return;
        }
        console.log("succes");
        fs.writeFileSync(filepath, data);
    });
       
    
}

module.exports = { password3LettreMinuscule };;