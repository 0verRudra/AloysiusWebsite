const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 25600;

// Ensure files directory exists
const filesDir = path.join(__dirname, 'public', 'files');

if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir, { recursive: true });
}

// Setup storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, filesDir); // Save files to public/files/
  },
  filename: (req, file, cb) => {
    const blockType = req.body.blockType || 'default';
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${blockType}${ext}`); // Save file as blockType.ext
  },
});

const upload = multer({ storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'your-secret-key', // Change this to a more secure secret
  resave: false,
  saveUninitialized: true
}));

const adminUsername = 'admin';
const adminPassword = '123456789';

const authenticateAdmin = (req, res, next) => {
  if (req.session.username === adminUsername && req.session.password === adminPassword) {
    return next();
  }
  res.redirect('/admin/login');
};

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/login.html'));
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === adminUsername && password === adminPassword) {
    req.session.username = username;
    req.session.password = password;
    res.redirect('/dashboard'); // Redirect to /dashboard after login
  } else {
    res.status(401).send('Unauthorized: Incorrect username or password');
  }
});

app.get('/dashboard', authenticateAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/main.html')); // Serve the main.html file
});

app.get('/upload', authenticateAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/upload.html')); // Serve the upload.html file
});

app.post('/upload', authenticateAdmin, upload.single('image'), (req, res) => {
  if (req.file) {
    res.send('Image uploaded successfully!');
  } else {
    res.status(400).send('No file uploaded');
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
