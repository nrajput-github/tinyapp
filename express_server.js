const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "randomId1"},
  "9sm5xK": { longURL: "http://www.google.com", userID: "randomId2"},
};

const urlsForUser = function(id) {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  } 
  return userUrls;
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  }
};

const userEmailExists = function(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user].id;
    }
  } return false;
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
    urls: urlsForUser(req.cookies["user_id"]), 
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { 
    user: users[req.cookies["user_id"]],
  };
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]],
  };

  res.render("urls_registration", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_login", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL].longURL,
    urlUserID: urlDatabase[req.params.shortURL].userID,
    user: users[req.cookies["user_id"]],
  };
  //res.render("urls_show", templateVars);
 // const longURL = urlDatabase[req.params.shortURL];
  res.render("urls_show", templateVars);
});
app.get("/u/:shortURL", (req, res) => {
/*
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL].longURL,
  };*/
  //res.render("urls_show", templateVars);
  let longURL = urlDatabase[req.params.shortURL];
  console.log(longURL);
  if (longURL === undefined) {
    res.send(400, `${req.params.shortURL} not found`);
  } else {
    longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});


app.post("/urls", (req, res) => {
  //console.log(req.body);  // Log the POST request body to the console
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"],
  };
  res.redirect(`/u/${shortURL}`);
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)

});


app.post("/login", (req, res) => {
  const gotEmail = req.body.email;
  const gotPassword = req.body.password;

  if (!userEmailExists(gotEmail)) {
    res.send(403, "There is no user with this email address");
  } else {
    const userID = userEmailExists(gotEmail);
    if (users[userID].password !== gotPassword) {
      res.send(403, "Invalid Password!");
    } else {
      res.cookie('user_id', userID);
      res.redirect("/urls");
    }
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.post("/register", (req, res) => {
  const gotEmail = req.body.email;
  const gotPassword = req.body.password;

  if (!gotEmail || !gotPassword) {
    res.send(400, "Invalid email or password!");
  };

  if (userEmailExists(gotEmail)) {
    res.send(400, "Email is already registered!");
  };

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

app.post("/urls/:shortURL/delete", (req, res) => {
  //console.log(req.body);  // Log the POST request body to the console
  const userID = req.cookies["user_id"];
  const userUrls = urlsForUser(userID);
  if (Object.keys(userUrls).includes(req.params.shortURL)) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.send(401);
  }

});

app.post("/urls/:id", (req, res) => {
  const userID = req.cookies["user_id"];
  const userUrls = urlsForUser(userID);
  if (Object.keys(userUrls).includes(req.params.id)) {
    const shortURL = req.params.id;
    urlDatabase[shortURL].longURL = req.body.newURL;
    res.redirect('/urls');
  } else {
    res.send(401);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
