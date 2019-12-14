if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config(); // loads .env vars and set them to process.env 
}

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methoOverride = require('method-override');

const initializePassport = require('./passport-config');
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id =>users.find(user => user.id === id),
);

const users = [];

app.set('view-engine', 'ejs');
// takes the forms from email and password and access them from req in POST
// ex: req.body.email
app.use(express.urlencoded({extended: false}));
app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false, // should we resave session values if nothing is changed?
  saveUninitialized: false, // do you want to save an empty value if no value?
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methoOverride('_method'));

/**** ROUTES *****/
// checkAuthenticated runs first!
app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', { name: req.user.name });
});

// Login
app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs');
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true, // displays a flash error to user
}));

// Register
app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs');
});

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    users.push({
      id: Date.now.toString(), // if we had a DB this would be automatic
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });
    res.redirect('/login');
  } catch {
    res.redirect('/register');
  }
  console.log(users);
});

app.delete('/logout', (req, res) => {
  req.logOut(); // automatically logs user out and clears session using passport
  res.redirect('/login');
});

/*** Middleware for authentication ***/
// essentially middleware to check if user is authenticated, to redirect to login
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/login');
};

// essentially middleware to check if user is not authenticated,
// to redirect users from places we don't want them to be in if
// they're already authenticated
// ex: if a user is logged in, we don't want them to go to the login page
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  
  next();
};

app.listen(3000);
