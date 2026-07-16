require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const connectDb = async () => {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URI);
};

const login = async (user) => {
  const response = await axios.post(`${BASE_URL}/auth/login`, {
    email: user.email,
    password: user.password,
  });
  return response.data.token;
};

const ensureUser = async (user) => {
  await connectDb();
  const email = user.email.toLowerCase();
  let existing = await User.findOne({ email });
  if (!existing) {
    existing = new User({ name: user.name, email, password: user.password, role: user.role });
    await existing.save();
    console.log('created user');
  } else {
    existing.name = user.name;
    existing.role = user.role;
    existing.password = await bcrypt.hash(user.password, 10);
    await existing.save();
    console.log('updated password for existing user');
  }
  const token = await login(user);
  console.log('login returned token length', token.length);
  return token;
};

(async () => {
  try {
    const user = {
      name: 'Test Officer',
      email: 'testofficer@gmail.com',
      password: 'test1234',
      role: 'officer',
    };
    await ensureUser(user);
  } catch (err) {
    console.error('error', err.response?.data || err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
