const path = require("path")
const express = require("express")
const app = express(); 

const http = require("http").createServer(app); 
const io = require("socket.io")(http); 
const mysql = require("mysql");
const redis = require('redis');

app.use((request, result, next) => {
    result.setHeader("Access-Control-Allow-Origin", "*");
    next();
});

var changes = false;
var redisDown = false;

app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/node_modules', express.static(path.join(__dirname,'node_modules')));


const client = redis.createClient({
    host: process.env.REDIS_HOST || '127.0.0.1' , //'redis',
    port: parseInt(process.env.REDIS_PORT) || 6379 //6379
}); // redis client

client.on('error', (err) => {
    console.error(err.message);
    redisDown = true;
});

client.on('connect', () => {
    console.log('Connected to Redis');
    redisDown = false;
});

var conn = mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost', //localhost
    user: process.env.MYSQL_USER || 'root', //root
    password: process.env.MYSQL_PASSWORD || '', //
    database: process.env.MYSQL_DATABASE || 'web_chat', //web_chat
    port: parseInt(process.env.MYSQL_PORT) || 3306 //3306
});

conn.connect((err) => {
    if(err) throw err;
    console.log("Connected to the mysql database");
});

io.on("connection", (socket) => {
    console.log("User connected", socket.id); 

    socket.on("new message", (data) => {

        io.emit("new message", data); 

        conn.query("INSERT INTO messages (message) VALUES('" + data + "')", (err, result) => {
            if(err) throw err;
           
            // console.log(result);
            changes = true;
        });
    });
});



//API for the get_messages
app.get("/get_messages", (request, result) => {
    // console.log("Messages Send"); 

    try {
        if(redisDown) throw 'error';   
        client.get("mysql", (err, data) => {
            if(err) throw err;

            if(data && !changes) { 
                console.log("Cached Data"); 
                result.send(data); 
            } else {
                conn.query("SELECT * FROM messages", function (err, messages) {
                    if(err) throw err;
                    // console.log(messages);
                    const data = JSON.stringify(messages);
                    if(typeof(data) != 'string') data = toString(data);
                    client.set("mysql", data);
                    changes = false;
                    console.log("Updating Cache");
                    result.send(data);
                }); 
            }
        });
    }catch(error) {

        conn.query("SELECT * FROM messages", function (err, messages) {
            if(err) throw err;
            // console.log(messages);
            const data = JSON.stringify(messages);
            if(typeof(data) != 'string') data = toString(data);
            console.log("From the database");
            
            result.send(data);
        });
    }

    
});

app.get("/", (request, result) => {
    result.sendFile(path.join(__dirname, 'index.html'));
    // result.send("Hello World !")
});

const PORT = parseInt(process.env.PORT) || 8080; //8080;
http.listen(PORT, () => {
    console.log("Listening to Port : ", PORT);
});




