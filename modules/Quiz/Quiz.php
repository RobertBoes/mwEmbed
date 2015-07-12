<?php
return array(
	"quiz" => array(
		'scripts' => array('resources/quiz.js' ),
		'dependencies' => 'mw.KBaseScreen',
		'kalturaPluginName' => 'quiz',
		'styles' => 'resources/quiz.css',


		'templates' => array(
            "quizstart" => "../Quiz/resources/templates/quiz.tmpl.html"
        ),
		'messageFile' => 'Quiz.i18n.php',
	),
);

