<?php
set_time_limit(0);
date_default_timezone_set('Europe/Moscow');

require __DIR__.'/vendor/autoload.php';

/////// CONFIG ///////
$debug = false;
$truncatedDebug = false;
//////////////////////


try {

    function instagram($username, $password){
        $ig = new \InstagramAPI\Instagram($debug, $truncatedDebug);
        $ig->login($username, $password);
        $userId = $ig->people->getUserIdForName($username);

        $info = $ig->people->getInfoById($userId);
        file_put_contents(__DIR__."/cache/".$username.".json", $info);

        $json = json_decode(file_get_contents(__DIR__."/cache/".$username.".json"));
        $profile_pic = file_get_contents($json->user->profile_pic_url);
        file_put_contents(__DIR__."/cache/".$username.".jpg", $profile_pic);
    }

    
} catch (\Exception $e) {
    echo 'Что-то пошло не так: '.$e->getMessage()."\n";
    exit(0);
}

?>