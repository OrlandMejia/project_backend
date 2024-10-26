require("dotenv").config();
const {HOST,USER,PASSWORD,DATABASE,KEY} = process.env;
const mysql = require('mysql');
const db = mysql.createConnection({
  host:"localhost",
  user:"root",
  password:"Omejia374@",
  database:"testing"
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the database');
  }
});

module.exports = db;