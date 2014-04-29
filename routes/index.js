var csv = require('csv');
var fs = require('fs');
var Player = require('../lib/conf.js').Player;
var Keeper = require('../lib/conf.js').Keeper;
var _ = require('lodash');
var async = require('async');
/*
 * GET home page.
 */

exports.index = function(req, res){
  // Player.find({ keeper: true }).sort({ cost: -1 }).exec(function(e,data) {
    res.render('index', {
      title: 'FBBL Cheat Sheet 2014',
      // players: data
    });
  // });
};

exports.getPlayers = function getPlayers(req, res) {
  Player.find().sort({ cost: -1 }).exec(function(e, players) {
    res.json(players);
  });
};

exports.importSkipKeepers = function importSkipKeepers(req, res) {
  exports.importPlayers("pitchers", function(count) {
    var pitchercount = count;
    exports.importPlayers("hitters", function(count) {
      var hittercount = count;

      exports.calculateInflation(function(inflationRate, players) {
        res.render('import', {
          title: 'Players Imported',
          data: {
            hitters: hittercount,
            pitchers: pitchercount,
            rate: inflationRate
          }
        });
      });
    });
  });
};

exports.importKeepers = function importKeepers(req, res) {
  Keeper.remove( {}, function() {
    var stream = fs.createReadStream(__dirname+'/../public/keepers.csv');

    csv()
      .from.stream(stream)
      .on('record', function(row, idx) {
        p = new Keeper();
        p.name = row[0];
        p.team = row[1];
        p.cost = row[2];

        p.save( function(e, player) {
          console.log("SAVED");
          console.log(player.name);
        });
      })
      .on('end', function(count){
        // res.render('reading', {
        //   title: 'Importing keeper data',
        //   p: 'keeper',
        //   count: count
        // });
        var keepercount = count;
        console.log("keepers imported");
        exports.importPlayers("pitchers", function(count) {
          var pitchercount = count;
          exports.importPlayers("hitters", function(count) {
            var hittercount = count;

            exports.calculateInflation(function(inflationRate, players) {
              res.render('import', {
                title: 'Keepers Imported',
                data: {
                  keepers: keepercount,
                  hitters: hittercount,
                  pitchers: pitchercount,
                  rate: inflationRate
                }
              });
            });
          });
        });
      });
  });
};

exports.clearPlayers = function clearPlayers(pos, cb) {
  if ( pos == 'hitters' ) {
    Player.remove( { position: { $ne: 'P' } }, cb );
  } else {
    Player.remove( { position: 'P' }, cb );
  }
};

exports.importPlayers = function importPlayers(pos, cb) {
  var stream = fs.createReadStream(__dirname+'/../public/' + pos + '.csv');

  csv()
    .from.stream(stream)
    .on('record', function(row, idx) {
      Player.findOne({
        name: row[0]
      }, function(e, p) {
        if ( null === p ) {
          console.log("CANT FIND, INSERTING");
          p = new Player();
          p.name = row[0];
          if ( pos !== 'pitchers' ) {
            p.position = row[2];
          }
        }
        p.team = row[1];
        p.cost = row[3];

        // if ( pos === 'pitchers' ) {
        //   if ( row.length === 11 ) {
        //     p.notes = row[10];
        //   }
        // } else {
        //   if ( row.length === 12 ) {
        //     p.notes = row[11];
        //   }
        // }

        Keeper.findOne({
          name: row[0]
        }, function(e, keeper) {
          if ( null !== keeper ) {
            p.keeper = true;
            p.drafted = true;
            p.price = keeper.cost;
          }

          p.save( function(e, player) {
            console.log("SAVED");
            console.log(player);
          });
        });
      });
    })
    .on('end', function(count){
      cb(count);
    });
};

exports.readData = function readData(req, res) {
  var pos = req.params.pos;
  var self = this;

  // exports.clearPlayers(pos, function() {
    exports.importPlayers(pos, function(count) {
      res.render('reading', {
        title: 'Importing ' + pos + ' data',
        p: pos,
        count: count
      });
    });
  // });
};

exports.calculateInflation = function calculateInflation(cb) { //(req, res) {
  var total = 12 * 260;
  var spentPreDraft, valueProtected, valueLeft, moneyLeft, inflationRate;
  exports.getKeeperValue(function(value) {
    spentPreDraft = value;
    exports.getValueProtected(function(value) {
      valueProtected = value;
      valueLeft = total - valueProtected;
      moneyLeft = total - spentPreDraft;
      inflationRate = moneyLeft / valueLeft;
      inflationRate = Math.round( inflationRate * 1000 ) / 1000;

      // var o = {};
      // var map = function() {
      //   emit(this._id, this.cost);
      // };
      // var reduce = function(key, values) {
      //   return Array.sum(values) * inflationRate;
      // };

      // var command = {
      //   mapreduce: "players", // the name of the collection we are map-reducing
      //   map: map.toString(), // a function for mapping
      //   reduce: reduce.toString(), // a function  for reducing
      //   query: {}, // filter conditions
      //   sort: {}, // sorting on field_3 (also makes the reducing process faster)
      //   out: "inflated_costs"  // doesn't create a new collection, includes the result in the output obtained
      // };

      // console.log(inflationRate);
      // require('../lib/conf.js').mongoose.connection.db.executeDbCommand(command, function(err, dbres) {
      //   if(err) throw err;

      //   console.log(dbres);
      //   console.log(dbres.documents[0].results);
      // });
      Player.find({}, function(err, data) {
        async.each(data, function(player, done) {
          player.inflated_cost = Math.round(inflationRate * player.cost);
          player.save(function(err) {
            done(null);
          });
        }, function() {
          Player.find().sort({ cost: -1 }).exec(function(e, players) {
            cb(inflationRate, players);
          });
        });
      });
    });
  });
};

exports.undraftPlayer = function undraftPlayer(req, res) {

};

exports.draftPlayer = function draftPlayer(req, res) {

};

exports.addPlayerNote = function addPlayerNote(req, res) {

};

exports.updateKeptCosts = function updateKeptCosts(req, res) {
  Keeper.find().exec(function(e, players) {
    async.map(players, function(player, done) {
      Player.findOne({
        name: player.name,
      }, function(e, p) {

        p.price = player.cost;
        p.save( function(e, uplayer) {
          done(null);
        });

      });
    }, function() {
      res.json({success: 1});
    });
  });
};

exports.getValueProtected = function getValueProtected(cb) {
  var value = 0;
  Keeper.find().exec(function(e, players) {
    // console.log(players.length);
    async.map(players, function(player, done) {
      Player.findOne({
        name: player.name,
      }, function(e, p) {
        // console.log(player);
        // console.log(p);
        // console.log(p.cost);
        if (p.cost > 0) {
          value += p.cost;
        }

        done(null);
      });
    }, function() {
      cb(value);
    });
  });
};

exports.getKeeperValue = function setKeeperPrices(cb) {
  Keeper.aggregate([
    {
      $group : {
        _id : null,
        value : {
          $sum : "$cost"
        }
      }
    }
    ], function(e, results) {
      return cb(results[0].value);
  });
};

exports.updatePlayer = function updatePlayer(req, res) {
  console.log(req.body);
  var player = req.body;
  console.log(player);

  Player.findOne({ _id: player._id }, function(e, p) {
    console.log("FOUND PLAYER");
    p.price = player.price;
    p.notes = player.notes;
    p.drafted = player.drafted;

    p.save(function() {
      Player.find().sort({ cost: -1 }).exec(function(e, players) {
        res.json(players);
      });
    });
  });
};