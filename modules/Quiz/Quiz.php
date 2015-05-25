<?php
return array(
	"quiz" => array(
		'scripts' => array('resources/knockout-3.3.0.js', 'resources/quiz.js','resources/quizGetCuepoints.js' ),
		'dependencies' => 'mw.KBaseScreen',
		'kalturaPluginName' => 'quiz',
		'styles' => 'resources/quiz.css',
//        'templates' => "../Quiz/resources/quiz.tmpl.html",

		'templates' => array(
            "quizstart" => "../Quiz/resources/templates/quiz.tmpl.html"
            //"displayQuestion" => "../Quiz/resources/templates/quizQuestion.tmpl.html",
        ),
		'messageFile' => 'Quiz.i18n.php',
	),
);