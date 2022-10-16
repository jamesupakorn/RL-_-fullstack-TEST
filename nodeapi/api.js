const client = require('./connection.js')
const express = require('express');
const app = express();

const cors = require("cors");

app.use(cors());
app.use(express.json());

app.listen(3300, ()=>{
    console.log("Sever is now listening at port 3300");
})


app.get('/beverage', (req, res)=>{
    client.query('Select * from beverage', (err, result)=>{
        if(!err){
            res.send(result.rows);
        } else {
            console.log(err);
        }
    });
    client.end;
})

app.get('/categories', (req, res)=>{
    client.query('select * from categories ORDER BY cat_id ASC;', (err, result)=>{
        if(!err){
            res.send(result.rows);
        } else {
            console.log(err);
        }
    });
    client.end;
})

app.get('/sweetness', (req, res)=>{
    client.query('Select * from sweetness', (err, result)=>{
        if(!err){
            res.send(result.rows);
        } else {
            console.log(err);
        }
    });
    client.end;
})

app.get('/option', (req, res)=>{
    client.query('Select * from "option"', (err, result)=>{
        if(!err){
            res.send(result.rows);
        } else {
            console.log(err);
        }
    });
    client.end;
})

app.get('/type', (req, res)=>{
    client.query('Select * from beverage_type', (err, result)=>{
        if(!err){
            res.send(result.rows);
        } else {
            console.log(err);
        }
    });
    client.end;
})

app.get('/beveragebycatid/:id', (req, res)=>{
    client.query(`select * from beverage where cat_id = ${req.params.id}`, (err, result)=>{
        if(!err){
            res.send(result.rows);
        }else {
            console.log(err);
        }
    });
    client.end;
})


client.connect();