const mongoose = require('mongoose');

const sauceSchema = mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  manufacturer: { type: String },
  description: { type: String },
  mainPepper: { type: String },
  imageUrl: { type: String },
  heat: { type: Number, min: 1, max: 10 },
  likes: { type: Number },
  dislikes: { type: Number },
  usersLiked: [],
  usersDisliked: []
});

module.exports = mongoose.model('Sauce', sauceSchema);