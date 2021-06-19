const express = require("express");
const helmet = require("helmet");
const app = express();
var mysql = require('mysql');
var fs = require("fs");
var bodyParser = require("body-parser");
var favicon = require('serve-favicon')
var path = require('path')
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
app.use(helmet());
app.use(express.static("./public"));


'use strict';
//sftp client
const Client = require('ssh2-sftp-client');

const config = {
    host: '3.137.11.154',
    port: '',
    username: 'ubuntu',
    password: '',
    privateKey: fs.readFileSync('workmode.pem')
};

let client = new Client;


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

//app.use(favicon(path.join(__dirname, 'frontendWM', 'icon.ico')))
app.listen(3000, console.log("Server Connected"));
//create db connection
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "nisal",
    database: "distro"
});

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
});

//for uploading
app.post('/upl1B', function (req, res) {

    console.log("came to upl1B");

    let remotePath = req.body.whichfile;
    let dst = fs.createWriteStream(req.body.whichfile);

    client.connect(config)
        .then(() => {
            return client.get(remotePath, dst);
        })
        .then(() => {
            client.end();
        })
        .catch(err => {
            console.error(err.message);
        });

    //sftpFastGet(req.body.whichfile);
    res.end();
})



//key to decrypt and encrypt files of cloud A
app.post('/encryptkeyforCA', function (req, res) {

    if (req.body.unam === "correct") {
        if (req.body.pass === "correct") {
            res.send({ keyforCA: "key" });
        }
    } else {
        res.send({ keyforCA: "WrongUorP" });
    }

})



//for downloading
app.post('/dwn1B', function (req, res) {
    console.log(req.body.key);
    console.log("came to dwn1B"+req.body.wwhichfile);

    if (req.body.key == "secret") {
        let data = fs.createReadStream(req.body.whichfile);
        var temp = req.body.whichfile;
        var res = temp.replace("uploads", "downloads");

        let remote = res;
        console.log("Conversion : temp "+temp+" res "+res);
        console.log("remote" + remote);

        client.connect(config)
            .then(() => {
                return client.put(data, remote);
            })
            .then(() => {
                return client.end();
            })
            .catch(err => {
                console.error(err.message);
            });
    } else {
        console.log("unauthorized");
    }
    //sftpFastGet(req.body.whichfile);
   
})



/*cloud distro stuff
//create table
app.post('/addtable', function (req, res) {
    var tablename = req.body.tablename;
    var colum1name = req.body.colum1name;
    var colum2name = req.body.colum2name;
    var colum3name = req.body.colum3name;

    var x = "CREATE  TABLE " + tablename + " ( " + colum1name + " VARCHAR(255)," + colum2name + " VARCHAR(255)," + colum3name + " VARCHAR(255))";
    console.log(x);

    con.query("CREATE  TABLE " + tablename + " ( " + colum1name + " VARCHAR(255)," + colum2name + " VARCHAR(255)," + colum3name + " VARCHAR(255))", function (err, result) {
        if (err) throw err;
        console.log("Table created");
        res.send("done");
    });

});

//create entry
//has to recieve 6 parameters plus the table parameter
//again suseptible to sql injections till the string check function is built
//colums are editable to give max functionality to the api for the customers to have multiple tables with different attributes
app.post('/addentry', function (req, res) {
    var tabn=req.body.tabn;
    var col1 = req.body.col1;
    var col2 = req.body.col2;
    var col3 = req.body.col3;
    var entry1 = req.body.entry1;
    var entry2 = req.body.entry2;
    var entry3 = req.body.entry3;

var x="INSERT INTO "+ tabn +"(colum1name,colum2name,colum3name) VALUES (?,?,?)";
console.log(x);

    con.query("INSERT INTO "+ tabn +" ("+col1+","+col2+","+col3+") VALUES (?,?,?)",[entry1,entry2,entry3], function (err, result) {
            if (err) throw err;
            console.log("Row inserted");
            res.send("done");
        });

});

//Find record
app.post('/findentry', function (req, res) {
    var tabn = req.body.tabn;
    var col = req.body.col;
    var find = req.body.find;
    var reqID = req.body.reqID;


    var x = "SELECT * FROM " + tabn + " WHERE " + col + " = ?";
    console.log(x);

    con.query("SELECT * FROM " + tabn + " WHERE " + col + " = ?", [find], function (err, result) {
        if (err) throw err;
        console.log("SELECT results done");
        //res.end('done');

        Object.keys(result).forEach(function (key) {
            var row = result[key];
            console.log(result[key]);


            console.log("start of findrecordresponse function in cloudA");
            var url="https://cloudsandmoon.com";
            url = url + "/findRecordResponse";
            var body = {};
            body.reqID = reqID;
            body.tabn = tabn;
            body.tabledata = row;



            var json = JSON.stringify(body);
            var http = new XMLHttpRequest();
            console.log(url + body);
            http.open("POST", url + "?" + body, true);
            http.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            http.onreadystatechange = function () {
              if (http.readyState === 4) {
                if (http.responseText === "done") {
                  console.log("sent through cloudA find record function");
                }

              }
            };
            http.send(json);

        });
    });

});
*/