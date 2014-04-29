var app = angular
  .module("DraftApp", ['ui.bootstrap'] );

app.factory('PlayerData', function($http) {
  return {
    getPlayers : function() {
      return $http({
        method: "GET",
        url: "/players/get"
      });
    },
    updatePlayer: function(player) {
      return $http({
        method: "POST",
        url: "/player/update/",
        data: player
      });
    }
  };
});

app.directive("playerlist", function() {
  return {
    scope: {
      title: "@playerlistTitle",
      pos: "@playerlistPos",
      count: "@playerlistCount",
      players: "=players",
      playerName: "=playerName"
    },
    link: function(scope, element, atts) {
      console.log(scope.players);
    },
    template: '<h4>{{title}}</h4> ' +
        '<ul>' +
          '<li ng-click="openModal(player)" ' +
          'ng-repeat="player in scope.data | filter: {position: {{pos}}} | limitTo: {{count}} | filter: {{playerName}}" ' +
          'ng-class="{\'keeper\': player.keeper, \'drafted\': player.drafted }", ng-class-odd="\'odd\'")>' +
            '<div class="row" tooltip-placement="top", tooltip="{{player.notes}}">' +
              '<div class="col-sm-1">' +
                '<span>{{$index + 1}}.</span>' +
              '</div>' +
              '<div class="col-sm-3">' +
                '<span ng-hide="player.cost < 0">' +
                  '${{player.cost}} ({{player.drafted ? player.price : player.inflated_cost}})' +
                '</span>' +
              '</div>' +
              '<div class="col-sm-6">' +
                '<span>' +
                  '{{player.name}}' +
                '</span>' +
              '</div>' +
              '<div class="col-sm-2">' +
                '<span>{{player.team}}</span>' +
                '<i class="fa fa-asterisk" ng-hide="!player.notes">' +
              '</div>' +
            '</div>' +
          '</li>' +
        '</ul>'
  }
});

app.filter('positionFilter', function() {
  return function(players, pos) {
    var searchRegx = new RegExp(pos, "i");
    if ( pos === undefined ) {
      return players;
    }
    var result = [];
    for(i = 0; i < players.length; i++) {
      if ( players[i].position.search(searchRegx) != -1 ) {
        result.push(players[i]);
      }
    }
    return result;
  };
});

var ModalPlayerCtrl = function ($scope, $modalInstance, player) {
  $scope.player = player;
  $scope.oldPrice = player.price;
  $scope.oldNotes = player.notes;
  // $scope.$watch("player", function(newValue, oldValue) {
  //   console.log(newValue);
  //   console.log(oldValue);
  //   console.log("hit");
  // }, true);

  $scope.ok = function () {
    player.price = parseInt(player.price, 10);

    if (player.price <= 0) {
      player.price = 0;
      player.drafted = false;
    } else {
      player.drafted = true;
    }
    $modalInstance.close(player);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
};

app.controller("CheatSheetController", function($scope, $http, $position, PlayerData, $modal) {
  $scope.data = [];
  // $scope.items = [
  //   {
  //     text: "Draft Player",
  //     // hide: !player.drafted,
  //     click: "openModal()"
  //   },
  //   {
  //     text: "Undraft Player",
  //     // hide: player.drafted,
  //     click: "openModal()"
  //   },
  //   {
  //     text: "Add Notes",
  //     click: "openModal()"
  //   }
  // ];


  $scope.openModal = function(player) {
    var modalInstance = $modal.open({
      templateUrl: 'playerModal.html',
      controller: ModalPlayerCtrl,
      resolve: {
        player: function () {
          return player;
        }
      }
    });

    modalInstance.result.then(function(player) {
      PlayerData.updatePlayer(player).success(function(data, status) {
        $scope.data = data;
      });
    }, function () {
      console.log("cancelled");
    });
  };

  // $scope.$watch(
  //   "data",
  //   function( newValue, oldValue ) {
  //     if ( newValue !== oldValue ) {
  //       console.log(newValue);
  //       console.log("updating!");
  //       // PlayerData.updatePlayer(player).success(function(data, status) {
  //       //   $scope.data = data;
  //       // });
  //     }
  //   }, true
  // );

  PlayerData.getPlayers().success(function(data, status) {
    $scope.data = data;
  });
});