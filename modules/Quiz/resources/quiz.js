(function (mw, $) {
    "use strict";
    $.cpObject = new Object();
    mw.PluginManager.add('quiz', mw.KBaseScreen.extend({

        defaultConfig: {
            parent: "controlsContainer",
            order: 5,
            align: "right",
            tooltip:  gM( 'mwe-quiz-tooltip' ),
            visible: false,
            showTooltip: true,
            displayImportance: 'medium',
            templatePath: '../Quiz/resources/templates/quiz.tmpl.html',
            usePreviewPlayer: false,
            previewPlayerEnabled: false
        },
        entryData: null,
        state: "start",
        questionHolder:null,


        setup: function () {
            //$.cpObject = new function();
            this.populateCpObject();
            this.addBindings();

        },
//  disable keyboard binding enable keyboard binnding when enabling disableinng control.
//gecomponent

        addBindings: function () {
            var _this = this;
            var embedPlayer = this.getPlayer();


            this.bind('layoutBuildDone', function () {

                var entryRequest = {
                    'service': 'baseEntry',
                    'action': 'get',
                    'entryId': embedPlayer.kentryid
                };
                _this.getKClient().doRequest(entryRequest, function (entryDataResult) {
                    _this.entryData = entryDataResult;
                    _this.showScreen();
                });

            });

            this.bind( 'KalturaSupport_AdOpportunity', function ( e, cuePointObj ) {
                _this.qCuePointHandler( e, cuePointObj );

            });

        },
        getKClient: function () {
            if (!this.kClient) {
                this.kClient = mw.kApiGetPartnerClient(this.embedPlayer.kwidgetid);
            }
            return this.kClient;
        },

        startQuiz: function(){

            this.getPlayer().enablePlayControls();
            this.removeScreen();
            this.getPlayer().play();

        },
        otherscreen:function(){

            this.state="otherscreen";

            this.removeScreen();
            this.showScreen();

        },
        getTemplateHTML: function(data){

            var _this = this;
            this.getPlayer().disablePlayControls();

            var quizStartTemplate = this.getTemplatePartialHTML("quizstart");

            var $template =  $(quizStartTemplate({
                'quiz': this,
                quizStartTemplate: quizStartTemplate
            }));

            $template
                .find('[data-click],[data-notification]')
                .click(function(e){
                    var data = $(this).data();
                    return _this.handleClick( e, data );
                });

            return $template;
        },
        handleClick: function( e, data ){

            e.preventDefault();

            if( data.click && $.isFunction(this[data.click]) ){
                this[data.click]( e, data );
            }

            if( data.notification ){
                this.getPlayer().sendNotification( data.notification, data );
            }

            return false;
        },

        qCuePointHandler:function  (e, cuePointObj){
console.log(e);
console.log(cuePointObj);
            this.setCurrentQuestion();

            return

        },

       displayAnsweresModel :function(){
        console.log("displayAnsweresModel ++++++++++++++++++++");
           var cpIndex = Math.floor((Math.random() * 10) + 1); // remove

           var _this = this;
           var result = $.grep($.cpObject.cpArray, function(e){ return e.key == cpIndex; });
console.log('result ');
console.log(result );
           _this.answeres = ko.observableArray();
           $.each( result[0].answeres, function( key, value ) {
               _this.answeres.push({ answer: value});
           });
           _this.displayQuestion = result[0].question

           _this.selectedAnswer = function(answeres) {
               alert((answeres));
           };
// remove this:
// if large number of object better this way: make single push and not for each
//           _this.answeres = ko.observableArray(ko.utils.arrayMap(arrToPush, function(number) {
//               return new Number(number)
//           }));
       },

        setCurrentQuestion:function(){
            var _this = this;
            this.state="question";
            _this.showScreen();
           ko.applyBindings(new this.displayAnsweresModel(),document.getElementById('questionContainer') );

        },
        populateCpObject:function(){

            /////// temp here     // populate temp cuepoints
            var cpArray = [];
            var len = 10;
            for (var i = 1; i < len+1; i++) {
                cpArray.push({
                    key: i,
                    question:'this is question number  ' + i + ' Why is there something rather than nothing?',
                    answeres:{
                        answer1:'answer '+i+ ' answer ' +i+ 'answer '+ i ,
                        answer2:'answer answer '+i+ ' answer ' +i+ 'answer '+ i,
                        answer3:'answer '+i+ 'answer answer ' +i+ 'answer '+ i,
                        answer4:'answer answer'+ i
                    },
                    isAnswerd:false
                });
            };
            $.cpObject.cpArray = cpArray;
        }
    }));

})(window.mw, window.jQuery);

