const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require('bcryptjs');
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
//const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
app.use(bodyParser.urlencoded({extended: true}));
//app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['Navya'],
  maxAge: 24 * 60 * 60 * 1000,
}));

const { generateRandomString, userEmailExists, getUserByEmail } = require("./helpers");

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

app.get("/", (req, res) => {
  if ((users[req.session.user_id] !== undefined)  && (req.session.user_id === users[req.session.user_id].id)) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.session.user_id),
    user: users[req.session.user_id],
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
  };
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/register", (req, res) => {
  if ((users[req.session.user_id] !== undefined)  && (req.session.user_id === users[req.session.user_id].id)) {
    // console.log(`reg if ${req.session.user_id}`);
    res.redirect("/urls");
  } else {
    //console.log(`reg else ${req.session.user_id}`);
    let templateVars = {
      user: users[req.session.user_id],
    };
    res.render("urls_registration", templateVars);
  }
});

app.get("/login", (req, res) => {
  
  if ((users[req.session.user_id] !== undefined)  && (req.session.user_id === users[req.session.user_id].id)) {
    res.redirect("/urls");
    //console.log(`log if ${req.session.user_id}`);

  } else {
  //console.log(`log else ${req.session.user_id}`);
    let templateVars = {
      user: users[req.session.user_id],
    };
    res.render("urls_login", templateVars);
  }
});


app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      urlUserID: urlDatabase[req.params.shortURL].userID,
      user: users[req.session.user_id],
    };
    //res.render("urls_show", templateVars);
    // const longURL = urlDatabase[req.params.shortURL];
    res.render("urls_show", templateVars);
  } else {
    res.status(404).send("Invalid short URL");
  }
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
    res.status(400).send(`ShortURL ${req.params.shortURL} not found`);
  } else {
    longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});


app.post("/urls", (req, res) => {
  //console.log(req.body);  // Log the POST request body to the console
  if (req.session.user_id) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session.user_id,
    };
    res.redirect(`/urls/${shortURL}`);
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)
  } else {
    res.status(401).send("Please logged in");
  }
});


app.post("/login", (req, res) => {
  const gotEmail = req.body.email;
  const gotPassword = req.body.password;

  if (!userEmailExists(gotEmail, users)) {
    res.status(403).send("There is no user with this email address");
  } else {
    const userID = getUserByEmail(gotEmail, users);
    if (!bcrypt.compareSync(gotPassword, users[userID].password)) {
      res.status(403).send("Invalid Password!");
    } else {
      req.session.user_id = userID;
      res.redirect("/urls");
    }
  }
});


app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.post("/register", (req, res) => {
  const gotEmail = req.body.email;
  const gotPassword = req.body.password;

  if (!gotEmail || !gotPassword) {
    res.status(400).send("Invalid email or password!");
  }

  if (userEmailExists(gotEmail, users)) {
    res.status(400).send("Email is already registered!");
  }

  const newUserID = generateRandomString();
  users[newUserID] = {
    id: newUserID,
    email: gotEmail,
    password: bcrypt.hashSync(gotPassword, 10),

  };
  // console.log(users[newUserID] );
  //console.log(users);
  req.session.user_id = newUserID;
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  //console.log(req.body);  // Log the POST request body to the console
  const userID = req.session.user_id;
  const userUrls = urlsForUser(userID);
  if (Object.keys(userUrls).includes(req.params.shortURL)) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.status(401);
  }

});

app.post("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  const userUrls = urlsForUser(userID);
  if (Object.keys(userUrls).includes(req.params.id)) {
    const shortURL = req.params.id;
    urlDatabase[shortURL].longURL = req.body.newURL;
    res.redirect('/urls');
  } else {
    res.status(401);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
