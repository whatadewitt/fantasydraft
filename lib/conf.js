var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongourl = 'mongodb://localhost/fantasydraft';

var PlayerSchema = new Schema({
  name: String,
  team: String,
  position: String,
  cost: {type: Number, default: 0 },
  inflated_cost: {type: Number, default: 0 },
  notes: String,
  keeper: { type: Boolean, default: false },
  drafted: { type: Boolean, default: false },
  price: {type: Number, default: 0 }
});
var Player = mongoose.model('Player', PlayerSchema);

var KeeperSchema = new Schema({
  name: String,
  team: String,
  cost: Number
});
var Keeper = mongoose.model('Keeper', KeeperSchema);

exports.Player = Player;
exports.Keeper = Keeper;

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log("Connected to Mongo!");
});
mongoose.connect(mongourl);

exports.db = db;
exports.mongoose = mongoose;