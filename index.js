const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const User = require('./models/users.js');
const bcrypt = require('bcrypt');
const hbs = require('hbs');
const Employee = require("./models/employee.js");
const mongoose = require('mongoose');

const app = express();
const port = 8080;

app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

const isAuthenticated = (req, res, next) => {
  if (req.session.authenticated) {
    next();
  } else {
    res.redirect('/login');
  }
};

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { name, email, number, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('register', { err: 'Email already exists. Please use another email.' });
    }

    const newUser = new User({ name, email, mobilenumber: number, password });
    await newUser.save();

    res.redirect('/login');
  } catch (error) {
    console.error(error);
    res.render('register', { err: 'Please try again.' });
  }
});

app.get('/home', isAuthenticated, async (req, res) => {
  try {
    const userData = await Employee.find({ userId: req.session.userId });
    res.render('home', { userData });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/home', isAuthenticated, async (req, res) => {
  try {
    const { name, email, mobilenumber } = req.body;

    if (!name || !email || !mobilenumber) {
      return res.status(400).send('All fields are required.');
    }

    const newEmployee = new Employee({ name, email, mobilenumber, userId: req.session.userId });
    await newEmployee.save();

    res.redirect('/home');
  } catch (error) {
    console.error('Error adding user data:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/login');
  });
});

app.get('/login', (req, res) => {
  if (req.session.authenticated) {
    res.redirect('/home');
  } else {
    res.render('login');
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (user && user.password === password) {
      req.session.authenticated = true;
      req.session.userId = user._id;
      res.redirect('/home');
    } else {
      res.render('login', { err: 'Invalid email or password. Please try again' });
    }
  } catch (error) {
    console.error(error);
    res.render('login', { err: 'Please try again' });
  }
});

app.get('/adddata', (req, res) => {
  res.render('adddata');
});

app.post('/adddata', async (req, res) => {
  const { name, email, mobilenumber } = req.body;
  try {
    if (!name || !email || !mobilenumber) {
      return res.render('adddata', { err: 'All fields are required.' });
    }

    const emailExists = await Employee.exists({ email });
    const mobileNumberExists = await Employee.exists({ mobilenumber });

    if (emailExists) {
      return res.render('adddata', { err: 'Email already exists. Please use another email.' });
    }

    if (mobileNumberExists) {
      return res.render('adddata', { err: 'Mobile number already exists. Please use another mobile number.' });
    }

    const newEmployee = new Employee({ name, email, mobilenumber, userId: req.session.userId });
    await newEmployee.save();

    res.redirect('/home');
  } catch (error) {
    console.error('Error adding employee data:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.delete('/deleteUser/:userId', isAuthenticated, async (req, res) => {
  const userId = req.params.userId;
  try {
    const employee = await Employee.findOneAndDelete({ _id: userId, userId: req.session.userId });
    if (!employee) {
      console.log('Employee not found');
      return res.status(404).send('Employee not found');
    }
    console.log('Employee deleted successfully');
    res.sendStatus(200);
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).send('Internal Server Error');
  }
});



app.get('/editUser/:userId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await Employee.findById(userId);
    if (user) {
      res.render('edit', { user });
    } else {
      return res.status(404).send('User not found');
    }

  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/editUser/:userId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { name, email, mobilenumber } = req.body;

    if (!name || !email || !mobilenumber) {
      return res.status(400).send('All fields are required');
    }

    const updatedUser = await Employee.findByIdAndUpdate(userId, { name, email, mobilenumber }, { new: true });

    if (!updatedUser) {
      return res.status(404).send('User not found');
    }

    res.redirect('/home');
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).send('Internal Server Error');
  }
});


mongoose.connect('mongodb+srv://niveyathomas134:AeXhz6V9Sv0ae9uL@cluster0.59ojosh.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true })
  .then(() => {
    console.log('Connected to MongoDB');
  });

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
