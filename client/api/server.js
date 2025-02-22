// server.js
//require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { Server } = require('socket.io');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();


const app = express();
const server = http.createServer(app);

module.exports = {
  io: io,
  handler: server, 
};

const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const { Group, Post } = require('./models/Group');
//const chatRoomRoutes = require('./routes/chatRooms');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});


cloudinary.config({
  cors: {
    origin: [process.env.FRONTEND_URL], 
    max_age: 3600
  }
});


// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use('/chat-rooms', chatRoomRoutes);

const SESSION_SECRET = process.env.SESSION_SECRET;
const MONGODB_URL = process.env.MONGODB_URL;

// Session configuration
app.use(session({
  secret: SESSION_SECRET, // Replace with a secure secret
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: MONGODB_URL,
    collectionName: 'sessions'
  }),
  cookie: { 
    secure: false, // set to true if using https
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));


// Passport initialization
app.use(passport.initialize());
app.use(passport.session());


app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsPath, filename);
  res.download(filePath, (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(404).send('File not found');
    }
  });
});


app.get('/api/sign-download-url', async (req, res) => {
  const { public_id } = req.query;
  console.log('Received request for signed URL. Public ID:', public_id);
  try {
    const signedUrl = cloudinary.url(public_id, {
      resource_type: 'raw',
      type: 'upload',
      sign_url: true,
      attachment: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600 // URL expires in 1 hour
    });
    console.log('Generated signed URL:', signedUrl);
    res.json({ signedUrl });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: 'Failed to generate download URL', details: error.message });
  }
});


// Connect to MongoDB
mongoose.connect(MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// User Model
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model('User', UserSchema);

//-----------
const groupSchema = new mongoose.Schema({
  name: String,
  code: { type: String, unique: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  files: [{
    name: String,
    url: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
    comments: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: String,
      createdAt: { type: Date, default: Date.now }
    }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }]
});

//const Group = mongoose.model('Group', groupSchema);


const resourceSchema = new mongoose.Schema({
  title: String,
  fileUrl: String,
  fileType: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }]
});

const Resource = mongoose.model('Resource', resourceSchema);
//-----------

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'group_files',
    resource_type: 'auto', // This allows all file types
    allowed_formats: ['jpg', 'png', 'pdf', 'doc', 'docx', 'txt', '*'], // Allow all formats
    public_id: (req, file) => `${Date.now()}-${file.originalname}`
  },
});


const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

const upload = multer({storage: storage});

/*
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    // Accept images, videos, and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'video/mp4' || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});


const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));
*/

const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    setUploadingFile(true);
    const response = await axios.post(`/groups/${groupId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    console.log('File upload response:', response.data);
    setFiles(prevFiles => [...prevFiles, response.data]);
  } catch (error) {
    console.error('Error uploading file:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      setError(`Failed to upload file: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('Error request:', error.request);
      setError('Failed to upload file: No response received from server');
    } else {
      console.error('Error message:', error.message);
      setError(`Failed to upload file: ${error.message}`);
    }
  } finally {
    setUploadingFile(false);
  }
};


// Chat Room Model
const chatRoomSchema = new mongoose.Schema({
  name: String,
  createdBy: String,
  participants: [String]
});

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

// Message Model
const MessageSchema = new mongoose.Schema({
  room: { type: String, required: true },
  user: { type: String, required: true },
  message: { type: String, required: true },
  fileUrl: String,
  fileType: String,
  createdAt: { type: Date, default: Date.now },
  editedAt: Date,
  deleted: { type: Boolean, default: false }
});
const Message = mongoose.model('Message', MessageSchema);

// Passport Local Strategy
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      return done(null, user);
    } else {
      return done(null, false, { message: 'Incorrect password.' });
    }
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'You must be logged in to perform this action' });
};

// Routes

// Register
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Login
app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: 'An error occurred during login', error: err.message });
    }
    if (!user) {
      return res.status(401).json({ message: info.message || 'Login failed' });
    }
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ message: 'An error occurred during login', error: err.message });
      }
      return res.json({ message: 'Logged in successfully', user: { id: user._id, username: user.username } });
    });
  })(req, res, next);
});

// Logout
app.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out', error: err.message });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error destroying session', error: err.message });
      }
      res.clearCookie('connect.sid'); // Clear the session cookie
      return res.json({ message: 'Logged out successfully' });
    });
  });
});

// Check Authentication
app.get('/check-auth', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: { id: req.user._id, username: req.user.username } });
  } else {
    res.json({ user: null });
  }
});

// Get Chat Rooms
app.get('/chat-rooms', isAuthenticated, async (req, res) => {
  try {
    console.log('Fetching chat rooms for user:', req.user._id);
    const rooms = await ChatRoom.find({ participants: req.user._id })
      .select('name lastMessage')
      .sort({ updatedAt: -1 })
      .populate('participants', 'username')
      .limit(20);
    
    console.log('Fetched rooms:', rooms);
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ message: 'Error fetching chat rooms', error: error.message, stack: error.stack });
  }
});

// Create Chat Room
app.post('/chat-rooms', isAuthenticated, async (req, res) => {
  try {
    const newRoom = new ChatRoom({ 
      name: `Room-${Date.now().toString(36)}`,
      createdBy: req.user._id,
      participants: [req.user._id]
    });
    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ message: 'Error creating chat room', error: error.message });
  }
});

// Get a specific chat room
app.get('/chat-rooms/:roomId', isAuthenticated, async (req, res) => {
  try {
    const room = await ChatRoom.findByIdAndUpdate(
      req.params.roomId,
      { name: req.body.name },
      { new: true }
    );
    if (!room) {
      return res.status(404).json({ message: 'Chat room not found or you do not have access' });
    }
    res.json(room);
  } catch (error) {
    console.error('Error fetching chat room:', error);
    res.status(500).json({ message: 'Error fetching chat room', error: error.message });
  }
});

// Join Chat Room
app.post('/chat-rooms/:roomId/join', isAuthenticated, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }
    if (!room.participants.includes(req.user._id)) {
      room.participants.push(req.user._id);
      await room.save();
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error joining chat room', error: error.message });
  }
});



app.put('/chat-rooms/:roomId', isAuthenticated, async (req, res) => {
  try {
    const room = await ChatRoom.findByIdAndUpdate(req.params.roomId, { name: req.body.name }, { new: true });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error updating room name', error: error.message });
  }
});

app.post('/chat-rooms/:roomId/leave', isAuthenticated, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);
    room.participants = room.participants.filter(p => p.toString() !== req.user._id.toString());
    await room.save();
    res.json({ message: 'Left room successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error leaving room', error: error.message });
  }
});

// Get chat rooms for the logged-in user
app.get('/chat-rooms', isAuthenticated, async (req, res) => {
  try {
    const rooms = await ChatRoom.find({ participants: req.user._id }).sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ message: 'Error fetching chat rooms', error: error.message });
  }
});

// Get Messages for a Chat Room
app.get('/chat-rooms/:roomId/messages', isAuthenticated, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

app.get('/chat-rooms/:roomId/messages', async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId })
      .sort({ createdAt: 1 })
      .limit(50);  // Limit to last 50 messages, adjust as needed
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// server.js

// Delete a message
app.delete('/chat-rooms/:roomId/messages/:messageId', isAuthenticated, async (req, res) => {
  try {
    const message = await Message.findOne({ _id: req.params.messageId, room: req.params.roomId });
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    if (message.user !== req.user.username) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }
    message.message = 'This message was deleted';
    message.type = 'system';
    await message.save();
    
    // Emit a socket event to update other users
    io.to(req.params.roomId).emit('message deleted', message);
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message', error: error.message });
  }
});

// Leave a chat room
app.post('/api/chatrooms/:roomId/leave', async (req, res) => {
  const { roomId } = req.params;
  const { username } = req.body;
  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }
    room.participants = room.participants.filter(p => p !== username);
    if (room.participants.length === 0) {
      await ChatRoom.findByIdAndDelete(roomId);
      res.json({ message: 'Chat room deleted as last participant left' });
    } else {
      await room.save();
    await systemMessage.save();
    
    // Emit a socket event to update other users
    io.to(req.params.roomId).emit('user left', { user: req.user.username, message: systemMessage });
    
    res.json({ message: 'Left chat room successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error leaving chat room', error: error.message });
  }
});

app.post('/api/groups', isAuthenticated, async (req, res) => {
  try {
    const { name } = req.body;
    const code = Math.random().toString(36).substring(7);
    const newGroup = new Group({
      name,
      code,
      creator: req.user._id,
      members: [req.user._id]
    });
    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Error creating group', error: error.message });
  }
});

app.post('/api/groups/join', isAuthenticated, async (req, res) => {
  try {
    const { code } = req.body;
    const group = await Group.findOne({ code });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (!group.members.includes(req.user._id)) {
      group.members.push(req.user._id);
      await group.save();
    }
    res.json(group);
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ message: 'Error joining group', error: error.message });
  }
});

app.post('/api/groups/:groupId/posts', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    console.log('Upload request received:', req.body);
    console.log('File:', req.file);

    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const postData = {
      description: req.body.description,
      uploadedBy: req.user._id,
      groupId: req.params.groupId,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []
    };

    if (req.file) {
      postData.fileName = req.file.originalname;
      postData.fileUrl = req.file.path;
      console.log('File uploaded to:', postData.fileUrl);
    }

    const newPost = new Post(postData);
    await newPost.save();

    const populatedPost = await Post.findById(newPost._id)
      .populate('uploadedBy', 'username');

    console.log('Post created:', populatedPost);
    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Error in file upload:', error);
    res.status(500).json({ 
      message: 'Error creating post', 
      error: error.message,
      stack: error.stack 
    });
  }
});


app.post('/api/groups/:groupId/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const newPost = new Post({
      description: req.body.description,
      tags: req.body.tags.split(',').map(tag => tag.trim()),
      fileName: req.file.originalname,
      fileUrl: req.file.path,
      uploadedBy: req.user._id,
      groupId: req.params.groupId
    });

    await newPost.save();

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

app.delete('/api/groups/:groupId', isAuthenticated, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check if user is the creator
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the group creator can delete the group' });
    }

    // Delete all posts associated with the group
    await Post.deleteMany({ groupId: req.params.groupId });
    
    // Delete the group
    await Group.findByIdAndDelete(req.params.groupId);
    
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ message: 'Error deleting group', error: error.message });
  }
});

// Leave group
app.post('/api/groups/:groupId/leave', isAuthenticated, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is the creator
    if (group.creator.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'Group creator cannot leave the group. Delete the group instead.' });
    }

    // Remove user from members
    group.members = group.members.filter(
      memberId => memberId.toString() !== req.user._id.toString()
    );
    
    await group.save();
    res.json({ message: 'Left group successfully' });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ message: 'Error leaving group', error: error.message });
  }
});


const mime = require('mime-types');

// Serve uploaded files


app.post('/api/upload', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ fileUrl: req.file.path });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});





app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
//-----------


// Get groups for a user
app.get('/api/groups', isAuthenticated, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('creator', 'username')
      .populate('members', 'username');
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Error fetching groups', error: error.message });
  }
});

// Get a specific group

app.get('api/groups/:groupId/files', async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.json(group.files || []);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ message: 'Error fetching files', error: error.message });
  }
});

app.get('/api/download/:fileUrl', async (req, res) => {
  try {
    const fileUrl = decodeURIComponent(req.params.fileUrl);
    const publicId = fileUrl.split('/').pop().split('.')[0]; // Extract public_id from URL
    
    const result = await cloudinary.utils.private_download_url(publicId, '', {
      resource_type: 'auto', // This will handle different file types automatically
      type: 'upload',
    });
    
    res.json({ downloadUrl: result });
  } catch (error) {
    console.error('Error generating download URL:', error);
    res.status(500).json({ message: 'Error generating download URL', error: error.message });
  }
});

app.post('/api/groups/:groupId/upload', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const file = {
      name: req.file.originalname,
      url: req.file.path, // Cloudinary URL
      uploadedBy: req.user._id,
      comments: []
    };
    group.files.push(file);
    await group.save();
    res.json(file);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

app.delete('/api/groups/:groupId/files/:fileId', isAuthenticated, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    const file = group.files.id(req.params.fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    if (file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own files' });
    }
    file.remove();
    await group.save();
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
});


// Add a comment to a file
app.post('/api/groups/:groupId/files/:fileId/comments', isAuthenticated, async (req, res) => {
  try {
    const { text } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    const file = group.files.id(req.params.fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    file.comments.push({ user: req.user._id, text });
    await group.save();
    res.json(file);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
});

app.post('/api/groups/:groupId/code', isAuthenticated, async (req, res) => {
  try {
    const { title, description, code, language } = req.body;
    
    const newPost = new Post({
      type: 'code',              // Explicitly set post type
      title,
      description,
      content: code,             // Store code in content field
      language,
      tags: req.body.tags || [],
      uploadedBy: req.user._id,
      groupId: req.params.groupId
    });

    const savedPost = await newPost.save();
    
    // Populate user info before sending response
    const populatedPost = await Post.findById(savedPost._id)
      .populate('uploadedBy', 'username');

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Error creating code post:', error);
    res.status(500).json({ 
      message: 'Error creating code post', 
      error: error.message 
    });
  }
});

// Like a file
app.post('/api/groups/:groupId/files/:fileId/like', isAuthenticated, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    const file = group.files.id(req.params.fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    if (!file.likes.includes(req.user._id)) {
      file.likes.push(req.user._id);
      await group.save();
    }
    res.json(file);
  } catch (error) {
    res.status(500).json({ message: 'Error liking file', error: error.message });
  }
});

app.get('/api/groups/:groupId', isAuthenticated, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('creator', 'username')
      .populate('members', 'username');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (!group.members.some(member => member._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }
    res.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ message: 'Error fetching group', error: error.message });
  }
});

// Create a new post
app.get('/api/groups/:groupId/posts', isAuthenticated, async (req, res) => {
  try {
    const posts = await Post.find({ groupId: req.params.groupId })
      .populate('uploadedBy', 'username')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
});



// Delete a post
app.delete('/api/groups/:groupId/posts/:postId', isAuthenticated, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }
    await Post.findByIdAndDelete(req.params.postId);
    group.posts = group.posts.filter(postId => postId.toString() !== req.params.postId);
    await group.save();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Error deleting post', error: error.message });
  }
});





// Get user's study content
app.get('/api/study/content', isAuthenticated, async (req, res) => {
  try {
    const content = await StudyContent.find({ owner: req.user._id })
      .sort({ createdAt: -1 });
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching study content', error: error.message });
  }
});
//-----------


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


/*
app.use('/uploads', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', path.basename(req.url.split('?')[0]));
  
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('File not found:', filePath);
      return res.status(404).send('File not found');
    }

    const contentType = mime.lookup(filePath) || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    if (req.query.download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    } else {
      res.setHeader('Content-Disposition', 'inline');
    }

    fs.createReadStream(filePath).pipe(res);
  });
});
*/



// Socket.IO
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join room', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on('chat message', async (data) => {
    try {
      console.log('Received message:', data); // Add logging
  
      const newMessage = new Message({
        room: data.room,
        user: data.user,
        message: data.message,
        fileUrl: data.fileUrl,
        fileType: data.fileType 
      });
  
      const savedMessage = await newMessage.save();
      console.log('Saved message:', savedMessage); // Add logging
  
      // Emit to room with saved message data
      io.to(data.room).emit('chat message', {
        _id: savedMessage._id,
        room: savedMessage.room,
        user: savedMessage.user,
        message: savedMessage.message,
        fileUrl: savedMessage.fileUrl,
        fileType: savedMessage.fileType,
        createdAt: savedMessage.createdAt
      });
  
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('leave room', (roomId) => {
    socket.leave(roomId);
    console.log(`User left room: ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  socket.on('join group', (groupId) => {
    socket.join(groupId);
    console.log(`User joined group: ${groupId}`);

  });

  socket.on('leave group', (groupId) => {
    socket.leave(groupId);
    console.log(`User left group: ${groupId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  socket.on('edit message', async (data) => {
    try {
      const message = await Message.findByIdAndUpdate(
        data.messageId,
        { message: data.newMessage, editedAt: new Date() },
        { new: true }
      );
      io.in(data.room).emit('message edited', message);
    } catch (error) {
      console.error('Error editing message:', error);
      socket.emit('message error', { message: 'Failed to edit message' });
    }
  });

  socket.on('delete message', async (data) => {
    try {
      const message = await Message.findByIdAndUpdate(
        data.messageId,
        { deleted: true },
        { new: true }
      );
      io.in(data.room).emit('message deleted', message);
    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('message error', { message: 'Failed to delete message' });
    }
  });



});


const startServers = async () => {
  try {
   
    
    
    const PORT = process.env.PORT || 8000;
   
   

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting servers:', error);
    process.exit(1);
  }
};

startServers();
/*
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
*/