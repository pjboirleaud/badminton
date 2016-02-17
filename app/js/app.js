'use strict';

var app = angular.module("badmintonApp", [
	'firebase',
	'ngRoute',
	'badmintonControllers',
	'badmintonFilters'
]);

var badmintonControllers = angular.module("badmintonControllers", ['firebase']);

var badmintonFilters = angular.module("badmintonFilters", []);

app.config(['$routeProvider',
	function($routeProvider) {
		$routeProvider.
		when('/main', {
			templateUrl: 'partials/bad-main.html',
			controller: 'MainController'
		}).
		when('/groups', {
			templateUrl: 'partials/bad-groups.html',
			controller: 'GroupsController'
		}).
		when('/group/:groupId', {
			templateUrl: 'partials/bad-group.html',
			controller: 'GroupsController'
		}).
		when('/players', {
			templateUrl: 'partials/bad-players.html',
			controller: 'PlayersController'
		}).
		when('/player/:playerId', {
			templateUrl: 'partials/bad-player.html',
			controller: 'PlayersController'
		}).
		when('/matchs', {
			templateUrl: 'partials/bad-matchs.html',
			controller: 'MatchsController'
		}).
		when('/match/:matchId', {
			templateUrl: 'partials/bad-match.html',
			controller: 'MatchsController'
		}).
		when('/stats', {
			templateUrl: 'partials/bad-stats.html',
			controller: 'StatsController'
		}).
		otherwise({
			redirectTo: '/main'
		});
	}
]);
// :matchId, etc --> lu avec $routeParams

var _fbRef = [];
var getFBRef = function(folder) {
    if(_fbRef[folder]){
        return _fbRef[folder];
    }
    _fbRef[folder] = new Firebase(FIREBASEURL + "/" + folder);
	authenticate(_fbRef[folder]);
	return _fbRef[folder];
}

var email=null, password=null;
var authenticate = function(fbRef) { 
	if(email == null) { 
	    email = $.cookie("email");
    	password = $.cookie("password");
    }
	if(email == undefined) { 
		email = prompt("Authentification : email");
		password = prompt("Authentification : mot de passe");
	}
	
	var auth = new FirebaseSimpleLogin(fbRef, function(error, user) {
		if (error) {
			console.log(error);
			email = null;
			password = null;
            _fbRef = [];
			$.removeCookie("email");
			$.removeCookie("password");
			alert("Erreur d'authentification");
		} else if (user) {
			console.log('Authentification OK --> User ID: ' + user.id + ', Provider: ' + user.provider);
			$.cookie("email", email);
			$.cookie("password", password);
		} else {
		}
	});
	
	auth.login('password', {
		email: email,
		password: password/*,
		rememberMe: true*/
	});
}

var firebaseGetAll = function($scope, $firebase) {
	$scope.groups = $firebase(getFBRef("groups"));
	$scope.players = $firebase(getFBRef("players"));
	$scope.matchs = $firebase(getFBRef("matchs"));
	$scope.stats = $firebase(getFBRef("stats"));
}

badmintonControllers.controller("MainController", ['$scope', '$firebase',
	function($scope, $firebase) {
		var today = new Date();
		$scope.date = today.getDate() + "/" + today.getMonth() + "/" + today.getFullYear();
		$scope.nplayers = 4;
		$scope.players = "";
		$scope.name = "";
	}
]);

badmintonControllers.controller("GroupsController", ['$scope', '$firebase',
	function($scope, $firebase) {
		firebaseGetAll($scope, $firebase);
		stats($scope);
		$scope.name = "";
		$scope.nplayers = 4;
		$scope.addGroup = function(event) {
			create = true;
			var selectedPlayers = {};
			for(var pid in $scope.players) {
				if($scope.players[pid] && $scope.players[pid].selected) {
					selectedPlayers[pid] = {name: $scope.players[pid].name};
				}
				if($scope.players[pid]) {
					delete $scope.players[pid].selected;
				}
			}
			$scope.groups.$add({name: $scope.name, nplayers: $scope.nplayers, players: selectedPlayers}); 
			$scope.name = "";
			$scope.nplayers = 4;
		}
		$scope.deleteGroup = function(id, event) {
			$(event.target).parents("tr").addClass('danger');
			if(confirm('Confirme-tu la suppression du groupe sélectionné ?')){
				$scope.groups.$remove(id);
			}
			$(event.target).parents("tr").removeClass('danger');
		}
		$scope.updateGroup = function(id, event) {
			successUpdate($(event.target).parents("tr"));
			$scope.groups.$save(id);
		}
	}
]);

var create = false;
function successCreate(element) {
	if(!create) {
		return;
	}
	$(element).addClass('success');
	setTimeout(function(){
		$(element).removeClass('success');
		create = false;
	}, 1500);
}
function successUpdate(element) {
	$(element).addClass('success');
	setTimeout(function(){
		$(element).removeClass('success');
	}, 1500);
}

badmintonControllers.controller("MatchLineController", ['$scope', '$element',
	function($scope, $element) {
		successCreate($element);
	}
]);

badmintonControllers.controller("GroupLineController", ['$scope', '$element',
	function($scope, $element) {
		successCreate($element);
	}
]);

badmintonControllers.controller("PlayerLineController", ['$scope', '$element',
	function($scope, $element) {
		successCreate($element);
	}
]);

badmintonControllers.controller("MatchsController", ['$scope', '$firebase',
	function($scope, $firebase) {
		firebaseGetAll($scope, $firebase);
		stats($scope);
		$scope.date = "";
		$scope.hour = "";
		$scope.group = "";
		$scope.paid = "";
		$scope.court = "";
		$scope.status = "A confirmer"; // A confirmer
		var date = new Date();
		$scope.query = $.datepicker.formatDate('yy-mm', date);
		$scope.thisMonth = $.datepicker.formatDate('yy-mm', date);
		$scope.thisYear = $.datepicker.formatDate('yy', date);
		date.setMonth(date.getMonth()-1);
		$scope.previousMonth = $.datepicker.formatDate('yy-mm', date);

		$scope.switchStatusForCreation = function(){
			if($scope.status.indexOf('Confirmé')!=-1) {
				$scope.status = 'A confirmer';
			} else if($scope.status.indexOf('A confirmer')!=-1) {
				$scope.status = 'Confirmé';
			} else {
				$scope.status = 'A confirmer';
			}
		}
		$scope.switchStatus = function(id, event){
			var parentTR = $(event.target).parents("tr").prev();
			if($scope.matchs[id].status == undefined || $scope.matchs[id].status.indexOf('Confirmé')!=-1) {
				$scope.matchs[id].status = 'A confirmer';
			} else if($scope.matchs[id].status.indexOf('A confirmer')!=-1) {
				$scope.matchs[id].status = 'Confirmé';
			} else {
				$scope.matchs[id].status = 'A confirmer';
			}
			$scope.matchs.$save(id);
			// $add n'a pas de callback pour le moment (https://github.com/firebase/angularFire/issues/185)
			// en attendant on fait une temporisation  de 200 ms + prev() / next() avant de marquer la ligne 
			// en vert 
			// sans ça, ça ne fonctionne pas, car dans le dom la ligne est remplacée par une autre une fois
			// l'update effectué (due au fait qu'on ait changé une valeur du scope --> le tri est re-opéré,
			// et tout le tableau donc rechargé)
			// ----> WTF ;) :)
			setTimeout(function(){
				successUpdate(parentTR.next());
			}, 200);
		}
		$scope.addMatch = function(event) {
			create = true;
			var selectedPlayers = {};
			for(var pid in $scope.groups[$scope.group].players) {
				if($scope.groups[$scope.group].players[pid] && $scope.groups[$scope.group].players[pid].selected) {
					selectedPlayers[pid] = {name: $scope.groups[$scope.group].players[pid].name};
				}
				if($scope.groups[$scope.group].players[pid]) {
					delete $scope.groups[$scope.group].players[pid].selected;
				}
			}
			$scope.matchs.$add({date: $scope.date, hour: $scope.hour, group: $scope.group, players: selectedPlayers, paid: $scope.paid, court: $scope.court, status: $scope.status}); 
			
			$scope.date = "";
			$scope.hour = "";
			$scope.group = "";
			$scope.paid = "";
			$scope.court = "";
			$scope.status = "A confirmer"; // A confirmer
		}
		$scope.deleteMatch = function(id, event) {
			$(event.target).parents("tr").addClass('danger');
			if(confirm('Confirme-tu la suppression du match sélectionné ?')){
				$scope.matchs.$remove(id);
			}
			$(event.target).parents("tr").removeClass('danger');
		}
		$scope.updateMatch = function(id, event) {
			successUpdate($(event.target).parents("tr"));
			$scope.matchs.$save(id);
		}
		$scope.removeMatchPlayer = function(mid, pid, event){
		    var parentTR = $(event.target).parents("tr").prev();
		    delete $scope.matchs[mid].players[pid];
		    $scope.matchs.$save(mid);
			setTimeout(function(){
				successUpdate(parentTR.next());
			}, 200);
		}
		$scope.addMatchPlayer = function(mid, pid, event){ 
		    var parentTR = $(event.target).parents("tr").prev();
		    if($scope.matchs[mid].players == undefined){
		        $scope.matchs[mid].players = {};
		    }
		    $scope.matchs[mid].players[pid] = {name: $scope.players[pid].name}
		    $scope.matchs.$save(mid);
			setTimeout(function(){
				successUpdate(parentTR.next());
			}, 200);
		}
		$scope.mailMatch = function(id) {
			var mails = "";
			for(var i in $scope.groups[$scope.matchs[id].group].players) {
				mails += "'" + $scope.players[i].mail + "'; ";
			}
			var subject = "BAD" 
			if($scope.matchs[id].court && $scope.matchs[id].court != "") {
				subject += " court n. " + $scope.matchs[id].court;
			}
			subject += " le " + $scope.matchs[id].date;
			subject += " - carte de " + $scope.players[$scope.matchs[id].paid].name;
			subject += " - " + $scope.matchs[id].status;
			var players = "";
			for(var i in $scope.matchs[id].players) {
				players += "   - " + $scope.matchs[id].players[i].name + " %0A ";
			}
			var n = window.open('mailto:' + mails + '?subject=' + subject + "&body=Joueurs:   %0A%0A" + players 
				+ "%0AStatus: " + $scope.matchs[id].status + "%0A%0AMERCI DE CONFIRMER%0A%0A" 
				+ window.location.protocol + "//" + window.location.host + "" + window.location.pathname + "#/matchs");
			n.close();
		}
		
		$.datepicker.regional['fr'] = {clearText: 'Effacer', clearStatus: '',
			closeText: 'Fermer', closeStatus: 'Fermer sans modifier',
			prevText: '&lt;Préc', prevStatus: 'Voir le mois précédent',
			nextText: 'Suiv&gt;', nextStatus: 'Voir le mois suivant',
			currentText: 'Courant', currentStatus: 'Voir le mois courant',
			monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin',
			'Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
			monthNamesShort: ['Jan','Fév','Mar','Avr','Mai','Jun',
			'Jul','Aoû','Sep','Oct','Nov','Déc'],
			monthStatus: 'Voir un autre mois', yearStatus: 'Voir un autre année',
			weekHeader: 'Sm', weekStatus: '',
			dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
			dayNamesShort: ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'],
			dayNamesMin: ['Di','Lu','Ma','Me','Je','Ve','Sa'],
			dayStatus: 'Utiliser DD comme premier jour de la semaine', dateStatus: 'Choisir le DD, MM d',
			dateFormat: 'yy-mm-dd', firstDay: 0, 
			initStatus: 'Choisir la date', isRTL: false};
		 $.datepicker.setDefaults($.datepicker.regional['fr']);
			$( ".match_date" ).datepicker();
		}
]);

badmintonControllers.controller("PlayersController", ['$scope', '$firebase',
	function($scope, $firebase) {
		firebaseGetAll($scope, $firebase);
		stats($scope);
		$scope.name = "";
		$scope.mail = "";
		$scope.addPlayer = function(event) {
			create = true;
			$scope.players.$add({name: $scope.name, mail: $scope.mail});
			$scope.name = "";
			$scope.mail = "";
		}
		$scope.deletePlayer = function(id, event) {
			$(event.target).parents("tr").addClass('danger');
			if(confirm('Confirme-tu la suppression du match sélectionné ?')){
				$scope.players.$remove(id);
			}
			$(event.target).parents("tr").removeClass('danger');
		}
		$scope.updatePlayer = function(id, event) {
			successUpdate($(event.target).parents("tr"));
			$scope.players.$save(id);
		}
	}
]);

function stats($scope) {
	var stats = {};
	var paid = {};
	var playersPlayed = {};
	var playersPerGroup = {};
	var statsPerGroup = {};
	var paidPerGroup = {};
	var minPaidPlayer = {};
	getFBRef("matchs").on('child_added', function(snapshot) {
		if(stats[snapshot.val().group] == undefined) {
			stats[snapshot.val().group] = {};
			statsPerGroup[snapshot.val().group] = 0;
			paid[snapshot.val().group] = {};
			paidPerGroup[snapshot.val().group] = 0;
			playersPerGroup[snapshot.val().group] = 0;
		}
		for(var pid in snapshot.val().players) {
			if(stats[snapshot.val().group][pid] == undefined) {
				stats[snapshot.val().group][pid] = 0;
				playersPlayed[pid] = true;
				playersPerGroup[snapshot.val().group]++;
			}
			stats[snapshot.val().group][pid]++;
			statsPerGroup[snapshot.val().group]++;
		}
		if(paid[snapshot.val().group][snapshot.val().paid] == undefined){
			paid[snapshot.val().group][snapshot.val().paid] = 0;
		}
		paid[snapshot.val().group][snapshot.val().paid]++;
		paidPerGroup[snapshot.val().group]++;

		for(var group in stats) {
			var minRatio=100000;
			minPaidPlayer[group] = null;
			for(var id in stats[group]){
				var ratio = paid[group][id]/stats[group][id]*playersPerGroup[group];
				if(ratio < minRatio) {
					minRatio = ratio;
					minPaidPlayer[group] = id;
				}
			}
			// console.log("minPaidPlayer[group]:"+minPaidPlayer[group]);
		}
	});

	$scope.stats = stats;
	$scope.statsPaid = $scope.paid = paid;
	$scope.playersPlayed = playersPlayed;
	$scope.playersPerGroup = playersPerGroup;
	$scope.statsPerGroup = statsPerGroup;
	$scope.paidPerGroup = paidPerGroup;
	$scope.minPaidPlayer = minPaidPlayer;
}

badmintonControllers.controller("StatsController", ['$scope', '$firebase',
	function($scope, $firebase) {
		firebaseGetAll($scope, $firebase);
		stats($scope);
	}
]);

badmintonFilters.filter('doubleSimple', function() {
	return function(input) {
		if(input == 2) {
			return "Simple";
		} else if(input == 4) {
		return "Double";
		} else if(input == 0) {
			return "Double";
		} else {
			return input + " joueur(s)";
		}
	};
});

badmintonFilters.filter('fbOrderBy', function(){
  return function(input, attribute) {
    if (!angular.isObject(input)) return input;

    var array = [];
    for(var objectKey in input) {
	  if(input[objectKey] && (objectKey.charAt(0) == '$' || jQuery.isFunction(input[objectKey]))){
	    continue;
	  }
	  input[objectKey].id = objectKey;
      array.push(input[objectKey]);
    }

    function compare(a,b) {
      if (a[attribute] < b[attribute])
        return -1;
      if (a[attribute] > b[attribute])
        return 1;
      return 0;
    }

    array.sort(compare);
    return array;
  }
});
