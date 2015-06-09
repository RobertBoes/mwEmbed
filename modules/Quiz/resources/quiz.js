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
        currentQuestionNumber:0,
        reviewMode:false,
        ansReviewMode:true,

        setup: function () {
   console.log("=======start=====");
            this.connectTo();
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
            this.continuePlay();
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

        continuePlay:function(){

            this.getPlayer().enablePlayControls();
            this.removeScreen();
            this.getPlayer().play();
        },

        qCuePointHandler:function  (e, cuePointObj){
            var _this = this;

     //    this.getCuePoints(); for API

            var questionNr = this.currentQuestionNumber;//
            _this.setCurrentQuestion(questionNr);//this.currentQuestionNumber);
            this.currentQuestionNumber +=1; // temp remove when cp done.
            if (this.currentQuestionNumber == 2) this.currentQuestionNumber =0;

 console.log('currentQuestionNumber => '+this.currentQuestionNumber);
            return
            // end temp remove
        },

        showUnAnswered:function(cPo,questionNr){
            var _this = this;
            var selectedAnswer = null;
            _this.showScreen();
            $(document).off(); //Remove all event handlers
            $(document).on('click','.single-answer-box', function () {
                $(".single-answer-box").each(function( index ) {
                    $(".single-answer-box-apply" ).detach();
                    $(this).css({"width":"96vw","height":"","overflow":"","color":""}).parent().css({"background-image":""});

                    //$($(this).parent().css({"background-image":""}));
                });
                $( this ).css( {"width":"76vw","height":$(this).outerHeight(),"overflow":"hidden","color":"black"})
                    .after( "<div class='single-answer-box-apply'>Apply</div>")
                    .parent().css( {"background-image": "url(../resources/applyBk.png)"});

                //$($( this ).parent().css( {"background-image": "url(../resources/applyBk.png)"}));

                selectedAnswer = $( this ).attr('id');
            });

            $.each( cPo.answeres, function( key, value ) {
                $(".answers-container").append(
                    "<div class ='single-answer-box-bk' id='qbk"+key+"'>" +
                        "<div class ='single-answer-box' id="+key+">"+value+"</div></div>");
            });

            $(document).on('click','.single-answer-box-apply', function (){
                $.cpObject.cpArray[questionNr].isAnswerd = true;
                $.cpObject.cpArray[questionNr].selectedAnswer = selectedAnswer;
                // add update answer
                $(this).html("Applied")
                    .parent().css({"background-image":"url(../resources/applliedBk.png)"});

                $(this).delay(1000).fadeIn(function(){

                    _this.removeScreen();

                    if ( $.isEmptyObject( $.grep( $.cpObject.cpArray, function(el){return el.isAnswerd === false}))  ){
                        _this.allCompleted();
                    }
                    else{
                        if (questionNr === (Object.keys(_this.getPlayer().kCuePoints).length-1)){ //need fix to quiz cuepoints !!
                            _this.almostDone(_this.getUnansweredQuestion());
                        }else{
                            _this.continuePlay();
                        }
                    }
                });

            });

        },
//////////////////////////////////////
        almostDone:function(unAnswerdArr){
            var _this = this;
            _this.state = "contentScreen";
            _this.showScreen();

            $(".title-text").html("Almost Done");
            $(".sub-text").html("It appears that the following questions remained unanswered"+"</br>"+"Press on relevant question to answer");

            $.each( unAnswerdArr, function( key, value ) {
                $(".display-content").append("<div class ='q-box' id="+key+">"+ _this.i2q(key) +"</div>" );
            });

            $(document).on('click','.q-box', function (){_this.setCurrentQuestion($(this).attr('id'));});

            $("div").removeClass('confirm-box')

        },
        getUnansweredQuestion:function(){
            var unanswerdArr = [];
            $.each($.cpObject.cpArray,function(key,val){
                if ($.cpObject.cpArray[key].isAnswerd === false){
                    unanswerdArr.push( $.cpObject.cpArray[key]);
                }
            });

            if ($.isEmptyObject(unanswerdArr)) return false;
            else return unanswerdArr;
        },


        showAnswered:function(result,questionNr){
            var _this = this;
            _this.removeScreen();
            _this.showScreen();

            $.each( result.answeres, function( key, value ) {
                $(".answers-container").append(
                    "<div class ='single-answer-box-bk'>" +
                    "<div class ='single-answer-box' id="+key+">"+value+"</div></div>");

                if (key == $.cpObject.cpArray[questionNr].selectedAnswer){
                    $('#'+key).css({"width":"76vw","height":$(this).outerHeight(),"overflow":"hidden","color":"black"})
                        .after( "<div class='single-answer-box-apply'>Applied</div>" );
                    $($('#'+key).parent().css( {"background-image": "url(../resources/applliedBk.png)"}));
                }
            });
        },
//////////////////////////////////////

        displayHint:function(questionNr){
            var _this=this;
            $(".header-container").append("<div class ='hint-box'>HINT</div>");
            $(document).on('click', '.hint-box', function () {
                _this.removeScreen();
                _this.state = "hint";
                _this.showScreen();
                $(".hint-container").append($.cpObject.cpArray[questionNr].hintText+'hint');
                $(document).off('click','.rectangle-box').on('click','.rectangle-box', function () {
                    _this.removeScreen();
                    _this.setCurrentQuestion(questionNr);
                });
            })
        },

        setCurrentQuestion:function(questionNr) {
console.log("setCurrentQuestion=================> ")+ questionNr ;
            var _this = this;
            var cPo = $.cpObject.cpArray[questionNr];
            _this.removeScreen();
            this.state = "question";
            this.question = cPo.question;
            this.showQuestionNumber =  this.i2q(questionNr);

            $(document).off(); //Remove all event handlers

            if ( cPo.isAnswerd) {
                _this.showAnswered(cPo, questionNr);
            }
            else{
                _this.showUnAnswered(cPo, questionNr);
            };

            if (cPo.alowHint) {
                _this.displayHint(questionNr);
            };

            this.addFooter(questionNr);
        },

//-----  footer ---------//
        addFooter:function(questionNr){
            var _this = this;
            if (this.reviewMode){
                $(".ftr-left").html("DONE REVIEW").on('click', function (){
                    _this.removeScreen();
                    _this.state = "thankyou";
                    _this.showScreen();
                });
                $(".ftr-right").html("REVIEW NEXT QUESTION").on('click', function (){
                    _this.removeScreen();
                    _this.setCurrentQuestion(questionNr);// add next question
                });;
            }else{
                $(".ftr-left").html("QUESTION NR " + this.i2q(questionNr));
                $(".ftr-right").html("SKIP FOR NOW").on('click', function (){
                    _this.continuePlay();
                });;
            };
        },
       //////////////////////////////////////////////////////////////////////////////////////////
        allCompleted:function(){

            var _this = this;
            var cPo = $.cpObject.cpArray;
            this.state = "contentScreen";
            this.reviewMode = true;

            _this.showScreen();

            $(".title-text").html("Completed");
            $(".sub-text").html("Take a moment to review your answeres below, or go ahead and submit.");

            $.each( cPo, function( key, value ) {
                $(".display-content").append("<div class ='q-box' id="+key+">"+ _this.i2q(key) +"</div>" );
            });

            $(document).on('click','.q-box', function (){_this.setCurrentQuestion($(this).attr('id'));});

            $(".confirm-box").html("Submit");//.on('click','.rectangle-box', function (){ _this.submitted()});
            $(document).on('click','.confirm-box', function (){
                _this.submitted();
            });
        },

        submitted:function(){
            var _this = this;
       //     $(".rectangle-box" ).detach();
            var cPo = $.cpObject.cpArray;
            _this.removeScreen();

            _this.showScreen();

            $(".title-text").html("Submitted");

            if (!this.ansReviewMode){
                $(".sub-text").html("you completed the quiz, your score is ... GET SCORE ");
            }else{
                $(".sub-text").html("you completed the quiz, your score is ... GET SCORE press any question to review submission ");

                $.each( cPo, function( key, value ) {
                    $(".display-content").append("<div class ='q-box' id="+key+">"+ _this.i2q(key) +"</div>" );
                });
                $(document).off().on('click','.q-box', function (){
                    _this.removeScreen();
                    this.state = "reviewAnswer";

                        _this.reviewAnswer();
                });
            };

            $(".confirm-box").html("Ok")
                .on('click','.rectangle-box', function (){
                    _this.continuePlay()
                    _this.currentQuestionNumber = 0;// fix remove temo
                 });
        },

        reviewAnswer:function(){
            var _this = this;
            _this.showScreen();
            $(".sub-text").html("Q: in ...  ");


            $(document).off().on('click','.gotItBox', function (){
                _this.removeScreen();

            });

        },


        populateCpObject:function(){


            /////// temp here     // populate temp cuepoints
            var cpArray = [];
            var len = 2;
            for (var i = 0; i < len; i++) {
                cpArray.push({
                    key: i,
                    question:'this is question number  -  Why is there something rather than nothing? this is question number ',
                    answeres:{
                        1:'answer '+i+ ' answer ' +i+ 'answer '+ i ,
                        2:'answer answer '+i+ ' answer ' +i+ 'answer '+ i,
                        3:'123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789  ' ,
                        4:'123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789'
                    },
                    isAnswerd:false,
                    selectedAnswer:null,
                    alowChange:false,
                    alowHint:true,
                    hintText: i+ 'one little two little three little indians four little five little six little indians'
                });
            };
            $.cpObject.cpArray = cpArray;
        },

        i2q:function(i){
            return i+1;
        },
        q2i:function(q){
            return q-1;
        },
        getCuePoints: function(){
            var cuePoints = [];
            var _this = this;
            if ( this.getPlayer().kCuePoints ) {
                $.each( _this.getConfig( 'cuePointType' ), function ( i, cuePointType ) {
                    $.each( cuePointType.sub, function ( j, cuePointSubType ) {
                        var filteredCuePoints = _this.getPlayer().kCuePoints.getCuePointsByType( cuePointType.main, cuePointSubType );
                        cuePoints = cuePoints.concat( filteredCuePoints );
                    } );
                } );
            }
            cuePoints.sort(function (a, b) {
                return a.startTime - b.startTime;
            });
            return cuePoints;
        },

        connectTo:function(){

            //var kConfig;
            //var kClient;
            //var partnerId = 102; // where 123 is your partner ID
            //var userId = "someone";
            //var expiry = 86400;
            //var privileges = "";
            //
            //
            //
            //kConfig = new KalturaConfiguration(partnerId);
            //kConfig.serviceUrl = "dev-backend8.dev.kaltura.com";
            //// if you want to communicate with a Kaltura server which is
            ////    other than the default http://www.kaltura.com
            //
            //kClient = new KalturaClient(kConfig);
            //kClient.ks = ks;


        }

    }));

})(window.mw, window.jQuery);

