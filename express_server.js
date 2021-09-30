const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  }
};

function generateRandomString() {
  let randomString = "";
   for (let i = 0; i < 6; i++) {
     const randomCharCode = Math.floor(Math.random() * 26 + 97);
     const randomChar = String.fromCharCode(randomCharCode);
     randomString += randomChar;
   }
   return randomString;
 }
 
app.get("/", (req, res) => {
  res.send("Hello!");
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase, 
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { 
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]],
  };

  res.render("urls_registration", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies["user_id"]],
  };
  //res.render("urls_show", templateVars);
 // const longURL = urlDatabase[req.params.shortURL];
  res.render("urls_show", templateVars);
});
app.get("/u/:shortURL", (req, res) => {

  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  //res.render("urls_show", templateVars);
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);

});


app.post("/urls", (req, res) => {
  //console.log(req.body);  // Log the POST request body to the console
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/u/${shortURL}`);
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)

});

app.post("/urls/:shortURL/delete", (req, res) => {
  //console.log(req.body);  // Log the POST request body to the console
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect(`/urls`);
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)

});
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.newURL;
  res.redirect('/urls');
});
app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.post("/register", (req, res) => {
  const gotEmail = req.body.email;
  const gotPassword = req.body.password;
/*
  if (!gotEmail || !gotPassword) {
    res.send(400, "Please include both a valid email and password");
  };

  if (userAlreadyExists(gotEmail)) {
    res.send(400, "An account already exists for this email address");
  };*/

  const newUserID = generateRandomString();
  users[newUserID] = {
    id: newUserID,
    email: gotEmail,
    password: gotPassword
  };
   // console.log(users[newUserID] );
    //console.log(users);
    res.cookie('user_id', newUserID);
    res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
