// Ionic Quiz App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'quiz' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('quiz', ['ionic', 'ngCordova', 'quiz.services'])
    .run(function($ionicPlatform, $cordovaFile, $cordovaToast, GameService, $localstorage) {
        $ionicPlatform.ready(function() {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }

            $ionicPlatform.onHardwareBackButton(function() {
                // initBookshelf();
            });
        });
    })
    .config(function($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise("/content/list");
        $stateProvider
            .state('loading', {
                url: "/loading",
                templateUrl: "templates/loading.html"
            })
            .state('contentList', {
                url: "/content/list",
                templateUrl: "templates/content-list.html",
                controller: 'ContentListCtrl'
            })
            .state('playWorksheet', {
                url: "/play/worksheet/:item",
                templateUrl: "worksheet1.html",
                controller: 'WorksheetCtrl'
            });
    })
    .controller('ContentListCtrl', function($scope, $http, $cordovaFile, $cordovaToast, $ionicPopover, $state, GameService, $localstorage) {
        // $scope.load = {
        //     status: true,
        //     message: "Loading..."
        // };
        setTimeout(function() {
            if (null == $localstorage.getObject('stories')) {
                $scope.getGames();
            } else {
                // $scope.load = {
                //     status: true,
                //     message: "Loading games..."
                // };
                $scope.$apply(function() {
                    $scope.games = $localstorage.getObject('games');
                    $scope.screeners = $localstorage.getObject('screeners');
                    $scope.stories = $localstorage.getObject('stories');
                    // $scope.load = {
                    //     status: false,
                    //     message: "Loading..."
                    // };
                });
                $scope.loadBookshelf();
            }
        }, 1000);

        $ionicPopover.fromTemplateUrl('templates/main-menu.html', {
            scope: $scope
        }).then(function(popover) {
            $scope.mainmenu = popover;
        });

        $scope.openMainMenu = function($event) {
            $scope.mainmenu.show($event);
        };
        $scope.closeMainMenu = function() {
            $scope.mainmenu.hide();
        };

        $scope.resetGameCache = function() {
            $("#loadingDiv").show();
            $localstorage.remove('stories');
            $localstorage.remove('games');
            $localstorage.remove('screeners');
            setTimeout(function() {
                $scope.getGames();
            }, 100);
        }

        $scope.loadBookshelf = function() {
            initBookshelf($scope);
        };

        $scope.getGames = function() {
            // $scope.load = {
            //     status: true,
            //     message: "Loading games..."
            // };
            GameService.getGamesLocal('screeners.json')
                .then(function(resp) {
                    $localstorage.setObject('screeners', resp);
                    $scope.screeners = $localstorage.getObject('screeners');
                    GameService.getGamesLocal('worksheets.json')
                        .then(function(gamesResp) {
                            $localstorage.setObject('games', gamesResp);
                            $scope.games = $localstorage.getObject('games');
                            GameService.getGamesLocal('stories.json')
                                .then(function(storiesResp) {
                                    $localstorage.setObject('stories', storiesResp);
                                    $scope.stories = $localstorage.getObject('stories');
                                    $scope.loadBookshelf();
                                }, function(err) {
                                });
                        }, function(err) {
                        });
                }, function(err) {
                });

        }

        $scope.playWorksheet = function(worksheet) {
            $state.go('playWorksheet', {
                'item': JSON.stringify(worksheet)
            });
        }

        $scope.gameClick = function(game) {
            window.location.href = game.launchUrl;
        }

        $scope.updateLog = function(game) {
            var logData = {
                identifier: game.identifier,
                name: game.name,
                timestamp: new Date()
            };
        }

    }).controller('WorksheetCtrl', function($scope, $http, $cordovaFile, $cordovaToast, $ionicPopover, $state, GameService, $localstorage, $stateParams) {
        if ($stateParams.item) {
            $scope.item = JSON.parse($stateParams.item);
            Renderer.start($scope.item.launchPath, 'gameCanvas');
        } else {
            alert('Name or Launch URL not found.');
            $state.go('contentList');
        }

    });


function initBookshelf($scope) {
    setTimeout(function() {
        var widthToHeight = 16 / 9;
        var newWidth = window.innerWidth;
        var newHeight = window.innerHeight;
        var newWidthToHeight = newWidth / newHeight;
        if (newWidthToHeight > widthToHeight) {
            newWidth = newHeight * widthToHeight;
        } else {
            newHeight = newWidth / widthToHeight;
        }
        $.bookshelfSlider('#bookshelf_slider', {
            'item_width': newWidth, 
            'item_height': newHeight,
            'products_box_margin_left': 30,
            'product_title_textcolor': '#ffffff',
            'product_title_bgcolor': '#990000',
            'product_margin': 30,
            'product_show_title': true,
            'show_icons': true,
            'buttons_margin': 15,
            'buttons_align': 'center', // left, center, right
            'slide_duration': 800,
            'slide_easing': 'easeOutCirc',
            'arrow_duration': 800,
            'arrow_easing': 'easeInCirc',
            'folder': ''
        });
        $(".panel_slider").height($(".view-container").height() - $(".panel_title").height() - $(".panel_bar").height());
        $("#loadingDiv").hide();
    }, 100);
}
