
const express = require("express");
//import { unlink } from 'fs';
const helmet = require("helmet");
const app = express();
const splitFile = require('split-file');
const fs = require('fs');
const router = express.Router();

const encrypt = require('node-file-encrypt');

//file upload application
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },

  // By default, multer removes file extensions so let's add them back
  filename: function (req, file, cb) {


    cb(null, file.originalname + '-' + Date.now() + path.extname(file.originalname));
  }
});

var mysql = require('mysql');

var favicon = require('serve-favicon')
var path = require('path')
var bodyParser = require("body-parser");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

//this is encryption

var encryptPath1 = '';
var encryptPath2 = '';
var keyforCA = "";
var keyforCB = "";


app.use(helmet());
app.use(express.static("./webcodes"));
app.use(bodyParser.urlencoded({ extended: false, limit: '2gb' }))
app.use(bodyParser.json())

//app.use(favicon(path.join(__dirname, 'frontendWM', 'icon.ico')))

app.listen(3000, console.log("Server Connected"));



app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

//create db connection
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "cloudEDFS1995",
  database: "cloudEDFS"
});


function getkeysforEncryption1() {


  //get the keys for CA and CB

  //for CA
  var urlenc2 = 'https://cloud2cloudsandmoon.xyz/encryptkeyforCA';
  body = {};
  body.unam = "correct";
  body.pass = "correct";
  var json = JSON.stringify(body);
  var http = new XMLHttpRequest();
  console.log(urlenc2 + body);
  http.open("POST", urlenc2 + "?" + body, true);
  http.setRequestHeader("Content-Type", "application/json; charset=utf-8");
  http.onreadystatechange = function () {
    if (http.readyState === 4) {


      console.log(http.responseText);

      var data = http.responseText;
      var jsonResponse = JSON.parse(data);
      if (jsonResponse["keyforCA"] !== 'WrongUorP') {
        keyforCA = jsonResponse["keyforCA"];
        console.log(keyforCA);
      } else {
        console.log("username or password to retrieve the key was incorrect");
      }


    }
  };
  http.send(json);

}

function getkeysforEncryption2() {
  //For CB
  var urlenc1 = 'https://cloud1cloudsandmoon.xyz/encryptkeyforCB';
  var body = {};
  body.unam = "correct";
  body.pass = "correct";
  var json1 = JSON.stringify(body);
  var http = new XMLHttpRequest();
  console.log(urlenc1 + body + body.unam);
  http.open("POST", urlenc1 + "?" + body, true);
  http.setRequestHeader("Content-Type", "application/json; charset=utf-8");
  http.onreadystatechange = function () {
    if (http.readyState === 4) {


      console.log(http.responseText);

      var data = http.responseText;
      var jsonResponse = JSON.parse(data);
      if (jsonResponse["keyforCB"] !== 'WrongUorP') {
        keyforCB = jsonResponse["keyforCB"];
        console.log(keyforCB);
      } else {
        console.log("username or password to retrieve the key was incorrect");
      }


    }
  };
  http.send(json1);

}


//to delete the uploaded files
function deletefiles(path) {
  // Assuming that 'path/file.txt' is a regular file.
  fs.unlink(path, (err) => {
    if (err) throw err;
    console.log(path + ' was deleted');
  });

}



app.post('/upload-profile-pic', function (req, res) {
  getkeysforEncryption1();
  getkeysforEncryption2();


  //stuff needed to upload to the database
  var fileName = "";
  var file1locname = "";
  var file2locname = "";
  var filesize = "";
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;



  var firstfilenamepath = "";
  var splitfile1path = "";
  var splitfile2path = "";
  var splitfilecrypt1path = "";
  var splitfilecrypt2path = "";
  // 'profile_pic' is the name of our file input field in the HTML form
  var upload = multer({ storage: storage }).single('profile_pic');


  upload(req, res, function (err) {
    // req.file contains information of uploaded file
    // req.body contains information of text fields, if there were any

    if (req.fileValidationError) {
      return res.send(req.fileValidationError);
    }
    else if (err instanceof multer.MulterError) {
      return res.send(err);
    }
    else if (err) {
      return res.send(err);
    }
    firstfilenamepath = '/home/ubuntu/app/cloudEDFS/uploads/' + req.file.filename;

    //to upload to database
    fileName = req.file.filename;
    filesize = req.file.size;

    /*req file obj has 
    {
      fieldname: 'profile_pic',
      originalname: 'madame-bovary.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      destination: 'uploads/',
      filename: 'madame-bovary.pdf-1622294619423.pdf',
      path: 'uploads/madame-bovary.pdf-1622294619423.pdf',
      size: 1515374
    } 
    */
    //console.log(req.file);


    splitFile.splitFile(__dirname + '/uploads/' + req.file.filename, 2)
      .then((names) => {
        //console.log(names);
        splitfile1path = names[0];
        splitfile2path = names[1];
        var filePath1 = ''; // source file path
        var filePath2 = '';
        filePath1 = names[0]; // source file path
        filePath2 = names[1];

        setTimeout(function () {


          try {




            // encrypt file for CB
            console.log(keyforCB);
            console.log(keyforCA);
            var f2 = new encrypt.FileEncrypt(filePath2);
            f2.openSourceFile();
            f2.encrypt(keyforCB);
            encryptPath2 = f2.encryptFilePath;
            console.log("encrypt sync done");

            // encrypt file for CA
            console.log(keyforCA);
            var f1 = new encrypt.FileEncrypt(filePath1);
            f1.openSourceFile();
            f1.encrypt(keyforCA);
            encryptPath1 = f1.encryptFilePath;
            console.log("encrypt sync done");

            splitfilecrypt1path = encryptPath1;
            splitfilecrypt2path = encryptPath2;

            //to upload to database
            file1locname = encryptPath1;
            file2locname = encryptPath2;


            //Uploading function
            var x = "INSERT INTO uploads(name,c1Name,c2Name,fileSize,uploadIP) VALUES (?,?,?,?,?) " + fileName + " " + file1locname + " " + file2locname + " " + filesize + " " + ip;
            console.log(x);

            con.query("INSERT INTO uploads(name,c1Name,c2Name,fileSize,uploadIP) VALUES (?,?,?,?,?)", [fileName, file1locname, file2locname, filesize, ip], function (err, result) {
              if (err) throw err;
              console.log("Row inserted");

            });



            //console.log(encryptPath1);
            // console.log(encryptPath2);


            TellToDownload(encryptPath1, 'https://cloud1cloudsandmoon.xyz/upl1A');
            TellToDownload(encryptPath2, 'https://cloud2cloudsandmoon.xyz/upl1B');



            console.log(names[0]);
            console.log(names[1]);

            setTimeout(deletefiles, 10000, firstfilenamepath);
            setTimeout(deletefiles, 10000, splitfile1path);
            setTimeout(deletefiles, 10000, splitfile2path);
            setTimeout(deletefiles, 10000, splitfilecrypt1path);
            setTimeout(deletefiles, 10000, splitfilecrypt2path);
          } catch (e) {
            console.log(e);
          }

        }, 3000);

      })
      .catch((err) => {
        console.log('Error: ', err);
      });


    res.redirect(req.get('referer'));


  });

});


//Tells clouds1 and moon to call the iwantfile api              1
function TellToDownload(whichfile, whichserver) {
  console.log("came to telltodownload");


  url = whichserver;
  var body = {};
  body.whichfile = whichfile;
  var json = JSON.stringify(body);
  var http = new XMLHttpRequest();
  console.log(url + body.whichfile);
  http.open("POST", url + "?" + body, true);
  http.setRequestHeader("Content-Type", "application/json; charset=utf-8");
  http.onreadystatechange = function () {
    if (http.readyState === 4) {
      if (http.responseText === "done") {
        console.log("sent through moon ask to download function");
      }

    }
  };
  http.send(json);


}

//get records from database to display
app.post('/records', function (req, res) {
  if (req.body.key == "secret") {
    con.query("SELECT name,fileSize FROM uploads", function (err, result, fields) {
      if (err) throw err;
      //var ord=JSON.stringify(result);
      res.json(result);
    });
  } else { res.send('*unauthorized*') }
});


//function to decrypt and download files
app.post('/clientDownload', function (req, res) {
  getkeysforEncryption1();
  getkeysforEncryption2();
  var filename = req.body.filename;
  var pass = req.body.pass;
  var loc1 = "";
  var loc2 = "";
  var jobj = {};
  //req.body.key == "secret"
  if (pass == "aa") {

    con.query("SELECT c1Name,c2Name FROM uploads WHERE name = ?", [filename], function (err, result) {
      if (err) throw err;
      console.log(result);
      //loc1=result["c1Name"];
      //loc2=result["c2Name"];
      jobj = result[0];
      console.log(jobj);
      loc1 = jobj["c1Name"];
      loc2 = jobj["c2Name"];
      console.log("loc1" + loc1 + "loc2" + loc2);


      TellToupload(loc1, "https://cloud1cloudsandmoon.xyz/dwn1A");
      TellToupload(loc2, "https://cloud2cloudsandmoon.xyz/dwn1B");


      //file paths
      var crypt1path = loc1.replace("uploads", "downloads");
      var crypt2path = loc2.replace("uploads", "downloads");
      //decrypting the files
      console.log("crypt1path " + crypt1path + "  crypt2path  " + crypt2path);



      setTimeout(function () {
        console.log("crypt1path " + crypt1path + "  crypt2path  " + crypt2path);
        // decrypt file 1
        let f = new encrypt.FileEncrypt(crypt1path);
        f.openSourceFile();
        f.decrypt(keyforCA);
        console.log("decrypt sync done");

        // decrypt file 2
        let f1 = new encrypt.FileEncrypt(crypt2path);
        f1.openSourceFile();
        f1.decrypt(keyforCB);
        console.log("decrypt sync done");


        fs.unlink(crypt1path, function () { });
        fs.unlink(crypt2path, function () { });

        //merge files
        var nam1 = "/home/ubuntu/app/cloudEDFS/downloads/" + filename + ".sf-part1";
        var nam2 = "/home/ubuntu/app/cloudEDFS/downloads/" + filename + ".sf-part2";
        console.log(nam1 + "  " + nam2);
        var names = [nam1, nam2];
        splitFile.mergeFiles(names, __dirname + '/downloads/' + filename)
          .then(() => {
            console.log('Done!');
            fs.unlink(nam1, function () { });
            fs.unlink(nam2, function () { });
            var n = __dirname + '/downloads/' + filename;
            console.log(n);
            var filen = "file=" + filename;
            var kee = "&key=right"
            var url = "https://cloudsandmoon.com/downloadfile?" + filen + kee;
            console.log(url);

            /*    var http = new XMLHttpRequest();
                console.log("GET", url);
                http.open("GET", url, true);
                http.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                http.onreadystatechange = function () {
                  if (http.readyState === 4) {
                    //console.log(http.responseText);
                    //res.end()
                  }
                }
                http.send();
    
    */

            res.json({ "link": url });
          })
          .catch((err) => {
            console.log('Error: ', err);
          });

        console.log("check downloads folder cus its done");
        //res.end();
      }, 5000);


    });

  }
  //timeout and res download

});



//Tells clouds1 or 2 and moon to call the sendfile api              1
function TellToupload(whichfile, whichserver) {
  console.log("came to telltoupload");


  url = whichserver;
  var body = {};
  body.whichfile = whichfile;
  body.key = "secret";
  var json = JSON.stringify(body);
  var http = new XMLHttpRequest();
  console.log(url + body.whichfile);
  http.open("POST", url + "?" + body, true);
  http.setRequestHeader("Content-Type", "application/json; charset=utf-8");
  http.onreadystatechange = function () {
    if (http.readyState === 4) {
      if (http.responseText === "done") {
        console.log("sent through moon ask to download function");
      }

    }
  };
  http.send(json);


}

app.get('/downloadfile', function (req, res) {
  var key = req.query.key;
  var file = req.query.file;
  console.log("key" + key + "file" + file);
  if (key == "right") {

    var path = __dirname + '/downloads/' + file;
    console.log(path);
    res.download(path, file, function (err) {
      if (err) {
        console.log(err); // Check error if you want
      }
      fs.unlink(path, function () {
        console.log("File was deleted") // Callback
      });

  })
}
  else {
    res.end();
  }
});





//delete all ez way
app.post('/delgod', function (req, res) {
  var secret = req.body.secret;
if(secret=="del"){
  console.log(secret);
  var sql = "DELETE FROM uploads ";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("everything deleted");
    res.end();
  });
}
});


/*
//create db connection
var con = mysql.createConnection({
  host: "localhost",
  user: "demouser",
  password: "demopassword",
  database: "distro"
});

//This stores the cloud list and if theres new clouds just add to this
var cloudlist = ["https://cloud1cloudsandmoon.xyz", "https://cloud2cloudsandmoon.xyz"];

//For search algorithm
var winnerrec = [];

//Function to check syntaxes
function stringchecker(string) {
  //alphanumberic
  var x = /^[A-Za-z0-9]+$/;
  //only numbers
  var y=/^\d+$/;
  if (string.match(x)) {
    if(!string.match(y)){
    return true;
    }
  } else {
    return false;
  }
}

//Create tables (POST)
//This api gets called for every table creation
app.post('/addtable', function (req, res) {
  var tablename = req.body.tablename;
  var colum1name = req.body.colum1name;
  var colum2name = req.body.colum2name;
  var colum3name = req.body.colum3name;
  console.log("addtable before regchecks")
  console.log(stringchecker(colum1name));
  if (stringchecker(tablename) === true) {
    if (stringchecker(colum1name) === true) {
      if (stringchecker(colum2name) === true) {
        if (stringchecker(colum3name) === true) {
          for (index = 0, len = cloudlist.length; index < len; ++index) {
            createtable(cloudlist[index], tablename, colum1name, colum2name, colum3name);
          }
          console.log("came to moon add tables api");

        }
      }

    }

  }

  res.end();

});
//Http call for creating tables
function createtable(url, tabname, col1, col2, col3) {
  console.log("start of createtable function in moon");
  url = url + "/addtable";
  var body = {};
  body.tablename = tabname;
  body.colum1name = col1;
  body.colum2name = col2;
  body.colum3name = col3;

  var json = JSON.stringify(body);
  var http = new XMLHttpRequest();
  console.log(url + body);
  http.open("POST", url + "?" + body, true);
  http.setRequestHeader("Content-Type", "application/json; charset=utf-8");
  http.onreadystatechange = function () {
    if (http.readyState === 4) {
      if (http.responseText === "done") {
        console.log("sent through moon create table function");
      }

    }
  };
  http.send(json);

}




//Create entries (POST)
//this api sends data to a random cloud on the network
//random function to select the server to store the records
app.post('/createentry', function (req, res) {
  var tabn = req.body.tabn;
  var col1 = req.body.col1;
  var col2 = req.body.col2;
  var col3 = req.body.col3;
  var entry1 = req.body.entry1;
  var entry2 = req.body.entry2;
  var entry3 = req.body.entry3;

  createentry(tabn, col1, col2, col3, entry1, entry2, entry3);
  console.log("came to moon createentry api");

  res.end();
});
//Get a random server
function getrandServer() {
  return cloudlist[Math.floor(Math.random() * cloudlist.length)];
}
//Http call for creating entries
function createentry(tabn, col1, col2, col3, entry1, entry2, entry3) {
  console.log("start of createentry function in moon");
  var server = getrandServer();
  url = server + "/addentry";
  var body = {};
  body.tabn = tabn;
  body.col1 = col1;
  body.col2 = col2;
  body.col3 = col3;
  body.entry1 = entry1;
  body.entry2 = entry2;
  body.entry3 = entry3;

  var json = JSON.stringify(body);
  var http = new XMLHttpRequest();
  console.log(url + body);
  http.open("POST", url + "?" + body, true);
  http.setRequestHeader("Content-Type", "application/json; charset=utf-8");
  http.onreadystatechange = function () {
    if (http.readyState === 4) {
      if (http.responseText === "done") {
        console.log("sent through moon create entry function");

      }

    }
  };
  http.send(json);

}




//Find records | search (GET)

app.post('/findentry', function (req, res) {
  console.log("Came to findentry in moon")
  var tabn = req.body.tabn;
  var col = req.body.col;
  var find = req.body.find;
  var reqID = req.body.reqID;

  for (index = 0, len = cloudlist.length; index < len; ++index) {
    findrecord(cloudlist[index], tabn, col, find, reqID);
  }

  res.end();
});

//Http call for Find records
function findrecord(url, tabn, col, find, reqID) {
  console.log("start of findrecord function in moon");
  url = url + "/findentry";
  var body = {};
  body.tabn = tabn;
  body.col = col;
  body.find = find;
  body.reqID = reqID;

  var json = JSON.stringify(body);
  var http = new XMLHttpRequest();
  console.log(url + body);
  http.open("POST", url + "?" + body, true);
  http.setRequestHeader("Content-Type", "application/json; charset=utf-8");
  http.onreadystatechange = function () {
    if (http.readyState === 4) {
      if (http.responseText === "done") {
        console.log("sent through moon find record function");
      }

    }
  };
  http.send(json);

}



//Find record response
//Function to record the responses and give priority only for the fist comer
app.post('/findRecordResponse', function (req, res) {

  var reqID = req.body.reqID;
  var tablename = req.body.tabn;
  var tabledata = req.body.tabledata;

  var struct = {};
  struct.reqID = reqID;
  struct.tablename = tablename;
  struct.tabledata = tabledata;

  console.log(reqID + " " + tablename + " " + tabledata.aaa + " " + tabledata.bbb + " " + tabledata.ccc);

  var check = 0;
  if (winnerrec.length === null) {
    winnerrec.push(struct);
    console.log("came to push if null");
  } else {
    for (var key in winnerrec) {
      console.log("came to for initial loop");
      //this is the first entry in the array
      var obj = winnerrec[key];
      //this is iterating inside the first entry in the array which is a json
      Object.keys(obj).forEach(function (k) {
        var row = obj[k];
        console.log(obj[k]);
        console.log("came to object keys loop");

        //console.log("obj" + obj + " objreq " + obj.reqID);
        if (row === req.body.reqID) {
          check = 1;
          console.log("came to check");
        }


      })

    };
    if (check === 0) {
      winnerrec.push(struct);
      console.log(req.body.reqID + "was pushed")
    }


  }

});




//Update records (POST)

//Delete records (POST)




//temporary login for MIT
app.get('/admindata', function (req, res) {


  var url = "https://www.nisalgamage.com/logdet";
  console.log(url);
  var http = new XMLHttpRequest();
  console.log("GET", url);
  http.open("GET", url, true);
  http.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function () {
    if (http.readyState === 4) {
      console.log(http.responseText);

      var data = http.responseText;
      var jsonResponse = JSON.parse(data);
      if (jsonResponse["username"] === req.query.username) {
        if (jsonResponse["password"] === req.query.password) {
          res.json({ "answer": "correct" });
          console.log("came here");
        }

      } else {
        console.log("caaame here");
        res.json({ "answer": "incorrect" });
      }
    }
  }
  http.send();
});

//check if admin is correct.this has been modified for the aove api so change  to admindata fi you want this tho work
app.get('/admindata1', function (req, res) {
  con.query("SELECT username, password FROM admin", function (err, result, fields) {
    if (err) throw err;
    console.log(req.query.username);
    console.log(req.query.password);
    if (result[0].username == req.query.username && result[0].password == req.query.password) {
      res.json({ "answer": "correct" });
    } else {
      res.json({ "answer": "incorrect" });
    }

  });
});

//get orders
app.get('/orders', function (req, res) {
  if (req.query.key == "secret") {
    con.query("SELECT * FROM orders", function (err, result, fields) {
      if (err) throw err;
      //var ord=JSON.stringify(result);
      res.json(result);
    });
  } else { res.send('*unauthorized*') }
});

//create orders
app.post('/Cord', function (req, res) {
  var oid = req.body.oid;
  var cdet = req.body.cdet;
  var otype = req.body.otype;
  var oprog = req.body.oprog;
  var empid = req.body.empid;
  res.send("oid = " + oid + ",cdet = " + cdet + ",otype = " + otype + ",oprog = " + oprog + ",empid = " + empid);
  //var userN="'"+user_name;
  //res.send("User name = "+user_name+", password is "+password);
  //res.end("yes");
  // var sql = "INSERT INTO orders (orderid,clientdetails,ordertype,orderprogress,employeeID) VALUES ("+oid+','+cdet+','+otype+','+oprog+','+empid+')';
  console.log("INSERT INTO orders (orderid, clientdetails, ordertype, orderprogress, employeeID) VALUES (" + oid + ",'" + cdet + "','" + otype + "','" + oprog + "'," + empid + ")");
  var sql = "INSERT INTO orders (orderid, clientdetails, ordertype, orderprogress, employeeID) VALUES (" + oid + ",'" + cdet + "','" + otype + "','" + oprog + "'," + empid + ")";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("1 record inserted");
  });

});
//delete orders
app.post('/delo', function (req, res) {
  var oid = req.body.oid;
  console.log(oid);
  var sql = "DELETE FROM orders WHERE orderid =" + oid;
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("1 record deleted");
  });

});
*/
