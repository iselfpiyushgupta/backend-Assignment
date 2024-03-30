const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const ejs = require('ejs');
const path = require('path');
const { validationResult } = require('express-validator');

const app = express();
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

mongoose.connect('mongodb://localhost:27017/github', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));
const userSchema = new mongoose.Schema({
  username: String,
  id: Number,
  avatar_url: String,
  type: String,
  name: String,
  company: String,
  blog: String,
  location: String,
  email: String,
  bio: String,
  public_repos: Number,
  followers: Number,
  following: Number,
  created_at: Date,
  updated_at: Date,
  deleted: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/save-user/:username', async (req, res) => {
  const username = req.params.username;

  try {
    const response = await axios.get(`https://api.github.com/users/${username}`);
    const userData = response.data;

    const newUser = new User({
      username: userData.login,
      id: userData.id,
      avatar_url: userData.avatar_url,
      type: userData.type,
      name: userData.name,
      company: userData.company,
      blog: userData.blog,
      location: userData.location,
      email: userData.email,
      bio: userData.bio,
      public_repos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    });

    await newUser.save();
    res.redirect('/list-users');
  } catch (error) {
    console.error('Error saving user data:', error.message);
    res.render('error', { message: 'Error saving user data' });
  }
});
app.get('/list-users', async (req, res) => {
  try {
    const users = await User.find({});
    res.render('users', { users });
  } catch (error) {
    console.error('Error listing users:', error.message);
    res.render('error', { message: 'Error listing users' });
  }
});
app.get('/save-user/:username', async (req, res) => {
  const username = req.params.username;

  try {
    const response = await axios.get(`https://api.github.com/users/${username}`);
    const userData = response.data;
    const newUser = new User({
      username: userData.login,
      id: userData.id,
      avatar_url: userData.avatar_url,
      type: userData.type,
      name: userData.name,
      company: userData.company,
      blog: userData.blog,
      location: userData.location,
      email: userData.email,
      bio: userData.bio,
      public_repos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    });

    await newUser.save();
    res.send('User data saved successfully');
  } catch (error) {
    console.error('Error saving user data:', error.message);
    res.status(500).send('Error saving user data');
  }
});
app.get('/find-mutual-followers/:username', async (req, res) => {
  const username = req.params.username;

  try {
    const responseFollowers = await axios.get(`https://api.github.com/users/${username}/followers`);
    const followers = responseFollowers.data.map(follower => follower.login);
    const responseFollowing = await axios.get(`https://api.github.com/users/${username}/following`);
    const following = responseFollowing.data.map(following => following.login);
    const mutualFollowers = followers.filter(follower => following.includes(follower));

    res.json(mutualFollowers);
  } catch (error) {
    console.error('Error finding mutual followers:', error.message);
    res.status(500).send('Error finding mutual followers');
  }
});

app.get('/search-users', async (req, res) => {
  try {
    const query = req.query;

    const users = await User.find(query);
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error.message);
    res.status(500).send('Error searching users');
  }
});

app.delete('/delete-user/:username', async (req, res) => {
  const username = req.params.username;

  try {
    const user = await User.findOneAndUpdate({ username }, { deleted: true });
    if (!user) {
      return res.status(404).send('User not found');
    }

    res.send('User record soft deleted successfully');
  } catch (error) {
    console.error('Error soft deleting user record:', error.message);
    res.status(500).send('Error soft deleting user record');
  }
});

app.patch('/update-user/:username', async (req, res) => {
  const username = req.params.username;
  const updateData = req.body;

  try {
    const user = await User.findOneAndUpdate({ username }, updateData, { new: true });
    if (!user) {
      return res.status(404).send('User not found');
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user details:', error.message);
    res.status(500).send('Error updating user details');
  }
});

app.get('/list-users', async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'username';
    const sortOrder = req.query.sortOrder || 'asc';

    const users = await User.find({}).sort({ [sortBy]: sortOrder });
    res.json(users);
  } catch (error) {
    console.error('Error listing users:', error.message);
    res.status(500).send('Error listing users');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
