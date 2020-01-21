<?php

/* Install.php expects:
* 	db: database name
* 	un: database username
* 	ps: database password
* 	host: database host
* 	pre: database prefix - session table name created off of prefix and "ci_sessions"
* 	login: admin login
* 	password: admin password
* 	name: admin name
* 	website_title: site title
* 	website_url: site url
*/

function error($text) {
	header("HTTP/1.0 400 Bad request");
	echo '{failed: "'.$text.'"}';
	exit;
}

function getURL($urls){
	if(substr($urls,0,6) != "http://" || substr($urls,0,7) != "https://"){
		preg_match_all('/((\w|\.)+)(\/)?(\S+)?/i', $urls, $return);
	} else {
		preg_match_all('/(http|ftp)+(s)?:(\/\/)((\w|\.)+)(\/)?(\S+)?/i', $urls, $return);
	}
	$numElements = count($return[0]);
	$foo=array();
	$foo=$return[0];
	$url=$foo[0];
	$url=preg_replace("/((http(s)?|ftp):\/\/)/", "", $url);
	$url=preg_replace("/([^\/]+)(.*)/", "\\1", $url);
	$urlcount = explode(".",$url);
	$urlcount1 = count($urlcount);
	$urlcount1--;
	if (preg_match('/\.co\./', $url)){
		$urlcount1--;
	}
	$url=preg_replace("/([^\.]+)\./i", "", $url,$urlcount1-1);
	return $url;
}

if (array_key_exists('db', $_POST) && array_key_exists('un', $_POST) &&
	array_key_exists('ps', $_POST) && array_key_exists('host', $_POST) &&
	array_key_exists('pre', $_POST) && array_key_exists('login', $_POST) &&
	array_key_exists('password', $_POST) && array_key_exists('name', $_POST) &&
	array_key_exists('website_title', $_POST) && array_key_exists('website_url', $_POST) &&
	array_key_exists('key', $_POST)) {

	function write_file($file, $data) {
		@chmod($file, 0777);
		if ( ! $fp = @fopen($file, 'wb')) {
			error("Couldn't write to file.");
		}
		flock($fp, LOCK_EX);
		fwrite($fp, $data);
		flock($fp, LOCK_UN);
		fclose($fp);
		@chmod($file, 0777);
	}
	
	$website_url = $_POST['website_url'];
	$lastChar = substr(trim($website_url), -1);
	if($lastChar != "/"){
		$website_url = $website_url."/";
	} else {
		$website_url = $website_url;
	}

	$lic = $_POST['license'];
	$m_url = getURL($website_url);

	$firstChars = substr($website_url, 0, 4); //add http:// to the url if it doesn't exist
	if ($firstChars != "http") {
		$website_url = "http://".$website_url;
	}

	if (crypt(md5($lic), md5($m_url)) == $_POST['key']) {
	if (isset($_GET['dbtest'])) {
	
		$link = @mysql_connect($_POST['host'], $_POST['un'], $_POST['ps']);
		if (!$link) { error("Couldn\'t connect to database."); }
		if (!mysql_select_db($_POST['db'], $link)) {
			mysql_query("CREATE DATABASE {$_POST['db']}") or error(mysql_error());
		}
		mysql_close($link);
	
	} elseif (isset($_GET['dbsetup'])) {
	
		mysql_pconnect($_POST['host'], $_POST['un'], $_POST['ps']);
		mysql_select_db($_POST['db']) or error(mysql_error());
		$testtable = mysql_query('SELECT * FROM `'.$_POST['pre'].'ci_sessions`');
		if (!$testtable) {
			mysql_query('SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO"');
			mysql_query('CREATE TABLE `'.$_POST['pre'].'extensions` (`id` int(11) NOT NULL auto_increment,
				`name` varchar(64) NOT NULL, `settings` text, PRIMARY KEY (`id`),
				UNIQUE KEY `name` (`name`)) ENGINE=MyISAM  DEFAULT CHARSET=utf8');
			mysql_query('CREATE TABLE `'.$_POST['pre'].'migrations` (`id` int(11) NOT NULL auto_increment,
				`extension_id` int(11) NOT NULL, `version` varchar(64) NOT NULL, PRIMARY KEY (`id`))
				ENGINE=MyISAM  DEFAULT CHARSET=utf8');
			mysql_query('CREATE TABLE `'.$_POST['pre'].'ci_sessions` ( `session_id` varchar(40) NOT NULL default \'0\',
				`ip_address` varchar(16) NOT NULL default \'0\', `user_agent` varchar(50) NOT NULL,
				`last_activity` int(10) unsigned NOT NULL default \'0\', PRIMARY KEY (`session_id`))
  			ENGINE=MyISAM DEFAULT CHARSET=utf8');
		  mysql_close();
		}

		//create directories
		$dirs = array("../upload/tmp", "../upload/media", "../upload/brand", "../upload/data", "../feed/blog", "../feed/cache", "../feed/gallery", "../feed/gallery_category", "../feed/lifestream");
		foreach ($dirs as $dir) {
			if (!is_dir($dir)) {
				mkdir($dir);
			}
			@chmod($dir,0777);
		}

	  $file = "../system/application/config/database.php";
	  $dbfile = @file_get_contents($file);
	  $dbfile = preg_replace('/\[\'production\'\]\[\'hostname\'\]\s*=\s*"(.*)";/',
  		'[\'production\'][\'hostname\'] = "'.$_POST['host'].'";', $dbfile);
	  $dbfile = preg_replace('/\[\'production\'\]\[\'database\'\]\s*=\s*"(.*)";/',
  		'[\'production\'][\'database\'] = "'.$_POST['db'].'";', $dbfile);
	  $dbfile = preg_replace('/\[\'production\'\]\[\'username\'\]\s*=\s*"(.*)";/',
  		'[\'production\'][\'username\'] = "'.$_POST['un'].'";', $dbfile);
	  $dbfile = preg_replace('/\[\'production\'\]\[\'password\'\]\s*=\s*"(.*)";/',
  		'[\'production\'][\'password\'] = "'.$_POST['ps'].'";', $dbfile);
	  $dbfile = preg_replace('/\[\'production\'\]\[\'dbprefix\'\]\s*=\s*"(.*)";/',
  		'[\'production\'][\'dbprefix\'] = "'.$_POST['pre'].'";', $dbfile);
		write_file($file, $dbfile);

	  $file = "../system/application/config/config.php";
	  $configfile = @file_get_contents($file);
	  $configfile = preg_replace('/\[\'sess_table_name\'\]\s*=\s*\'(.*)\';/',
  		"['sess_table_name'] = '{$_POST['pre']}ci_sessions';", $configfile);
		write_file($file, $configfile);
		
	    $fr_config = "<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');\n";
	    $fr_config .= '$config["base_url"] = "'.$website_url.'";'."\n";
	    $fr_config .= '$config["sess_cookie_name"] = "ci_'.substr(md5($website_url), 0, 16).'";'."\n";
	    $fr_config .= '$config["website_title"] = "'.str_replace('"', '\"', $_POST['website_title']).'";'."\n";
	    $fr_config .= '$config["blogs_url"] = "'.str_replace('"', '\"', $website_url."blog/").'";'."\n";
	    $fr_config .= '$config["blogs_category"] = "NO";'."\n";
	    $fr_config .= '$config["galleries_url"] = "'.str_replace('"', '\"', $website_url."galleries/").'";'."\n";
	    $fr_config .= '$config["galleries_category"] = "NO";'."\n";
	    $fr_config .= '$config["mod_comments"] = "YES";'."\n";
	    $fr_config .= '$config["captcha"] = "YES";'."\n";
	    write_file("../system/application/config/fr_config.php", $fr_config);		

	} elseif (isset($_GET['usersetup'])) {
	
		mysql_pconnect($_POST['host'], $_POST['un'], $_POST['ps']);
		mysql_select_db($_POST['db']) or error(mysql_error());
		mysql_query("UPDATE {$_POST['pre']}users SET login='{$_POST['login']}', password='".md5($_POST['password'])."', name=\"{$_POST['name']}\", email='{$_POST['email']}' WHERE login='admin'");
		mysql_query("UPDATE {$_POST['pre']}systems SET website_title=\"{$_POST['website_title']}\", website_url='$website_url', blogs_url='".$website_url."blog/', galleries_url='".$website_url."galleries/' WHERE id=1");
	  	
		// Template Website Setup
		if($_POST['template'] == "0"){ // Do Not Install

				function remove_dir($current_dir) { 
		        if($dir = @opendir($current_dir)) {
		            while (($f = readdir($dir)) !== false) {
		                if($f > '0' and filetype($current_dir.$f) == "file") {
		                    unlink($current_dir.$f);
		                } elseif($f > '0' and filetype($current_dir.$f) == "dir") {
		                    remove_dir($current_dir.$f."\\");
		                }
		            }
		            closedir($dir);
		            rmdir($current_dir);
		        }
		    }	  	  	
	  		unlink("../public/about.html");
	  		unlink("../public/blog.html");
	  		unlink("../public/entry.html");
	  		unlink("../public/header.html");
	  		unlink("../public/footer.html");
	  		unlink("../public/js/index.js");
	  		remove_dir("../public/css/");
	  		remove_dir("../public/images/");
	  		rename("../public/alt.html", "../public/index.html");
			@chmod("../public",0755);
			
	  } else { // Install
			
			unlink("../public/alt.html"); // remove alternate index.html
			
			function mediaPath($filename)
			{
				$dir = substr(md5($filename), 0, 2);
				if (!is_dir("../upload/media/".$dir)) {
					mkdir("../upload/media/".$dir);
					@chmod("../upload/media",0777);
				}
				return "../upload/media/{$dir}/{$filename}";
			}
			function createthumb($name,$filename,$new_w,$new_h)
			{
				$system=array_pop(explode(".",$name));
				if (preg_match("/jpg|jpeg/i",$system)){$src_img=imagecreatefromjpeg($name);}

				$old_w=imageSX($src_img);
				$old_h=imageSY($src_img);

				$ratio1 = $new_w / $old_w;
				$ratio2 = $new_h / $old_h;

				if ($ratio1 < 1 or $ratio2 < 1) {
					if ($ratio1 < $ratio2)
					{
						$thumb_w=$new_w;
						$thumb_h=$old_h*$ratio1;
					} else {
						$thumb_w=$old_w*$ratio2;
						$thumb_h=$new_h;
					}
					$dst_img=ImageCreateTrueColor($thumb_w,$thumb_h);
					imagecopyresampled($dst_img,$src_img,0,0,0,0,$thumb_w,$thumb_h,$old_w,$old_h); 
					imagejpeg($dst_img,$filename, 90); 
					imagedestroy($dst_img); 
					imagedestroy($src_img); 
				} else {
					$dst_img=ImageCreateTrueColor($old_w,$old_h);
					imagecopyresampled($dst_img,$src_img,0,0,0,0,$old_w,$old_h,$old_w,$old_h); 
					imagejpeg($dst_img,$filename, 90); 
					imagedestroy($dst_img); 
					imagedestroy($src_img); 
				}
			}

			$sql = array(
				"INSERT INTO `{$_POST['pre']}blog_categories` VALUES(1, 'General', 'NO', 0, '2009-08-09 04:39:52', '2009-08-10 04:30:49', 1, 'general')",
				"INSERT INTO `{$_POST['pre']}blog_categories` VALUES(2, 'Business', 'NO', 1, '2009-08-10 03:30:56', '2009-08-10 03:30:59', 1, 'business')",

				"INSERT INTO `{$_POST['pre']}blog_entries` VALUES(1, 1, 'Sample Blog Post', 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nunc feugiat. In a massa. In feugiat pharetra lacus. In non arcu nec libero pharetra rutrum. a gravida tristique metus. Na massa. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nunc feugiat. In non arcu nec libero pharetra rutrum. a gravida tristique metus. N a massa. Lorem ipsum dolor sit amet.\n\n<img src=\"{{base_url}}upload/media/IMG6841~500x500.jpg\" alt=\"Yosemite 01\" />\nLorem ipsum dolor sit amet, consectetuer adipiscing elit.\n\n<img src=\"{{base_url}}upload/media/IMG6730~500x500.jpg\" alt=\"Yosemite 02\" />\nIn non arcu nec libero pharetra rutrum. a gravida tristique metus. N a massa. Lorem ipsum dolor sit amet.', 'sample-blog-post', '', 'YES', 'NO', 'YES', 'YES', '', '2009-08-09 04:41:30', '2009-08-10 03:44:21', 'NO', 1, 'YES', 'NO', '')",
				"INSERT INTO `{$_POST['pre']}blog_entries` VALUES(2, 1, 'Another Blog Post', 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nunc feugiat. In a massa. In feugiat pharetra lacus. In non arcu nec libero pharetra rutrum. a gravida tristique metus. \n\nNa massa. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nunc feugiat. In a massa. In feugiat <a href=\"http://www.firerift.com/\">pharetra lacus</a>. In non arcu nec libero pharetra rutrum. a gravida tristique metus. Na massa. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nunc feugiat. In a massa. In feugiat pharetra lacus. In non arcu nec libero pharetra rutrum. a gravida tristique metus. Na massa. Lorem ipsum dolor sit amet.', 'another-blog-post', '', 'YES', 'NO', 'YES', 'YES', '', '2009-08-09 04:46:39', '2009-08-10 03:26:11', 'NO', 1, 'YES', 'NO', '')",
				"INSERT INTO `{$_POST['pre']}blog_entries` VALUES(3, 2, 'Post About Business', 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nunc feugiat. In a massa. In feugiat pharetra lacus. In non arcu nec libero pharetra rutrum. a gravida tristique metus. Na massa. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nunc feugiat. In non arcu nec libero pharetra rutrum. a gravida tristique metus. N a massa. Lorem ipsum dolor sit amet.\n\n<object width=\"500\" height=\"282\"><param name=\"allowfullscreen\" value=\"true\" /><param name=\"allowscriptaccess\" value=\"always\" /><param name=\"movie\" value=\"http://vimeo.com/moogaloop.swf?clip_id=1514024&amp;server=vimeo.com&amp;show_title=0&amp;show_byline=0&amp;show_portrait=0&amp;color=00ADEF&amp;fullscreen=1\" /><embed src=\"http://vimeo.com/moogaloop.swf?clip_id=1514024&amp;server=vimeo.com&amp;show_title=0&amp;show_byline=0&amp;show_portrait=0&amp;color=00ADEF&amp;fullscreen=1\" type=\"application/x-shockwave-flash\" allowfullscreen=\"true\" allowscriptaccess=\"always\" width=\"500\" height=\"282\"></embed></object>\n', 'post-about-business', '', 'YES', 'NO', 'YES', 'YES', '', '2009-08-10 04:23:44', '2009-08-10 04:23:44', 'NO', 1, 'YES', 'NO', '')",
				"INSERT INTO `{$_POST['pre']}blog_entries` VALUES(4, 2, 'The Stocks Are Up!', 'Suspendisse vestibulum dignissim quam. Integer vel augue. Phasellus nulla purus, interdum ac, venenatis non, varius rutrum, leo. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Duis a eros. \n\nClass aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos. Fusce magna mi, porttitor quis, convallis eget, sodales ac, urna. Phasellus luctus venenatis magna. Vivamus eget lacus. Nunc tincidunt convallis tortor. Duis eros mi, dictum vel, fringilla sit amet, fermentum id, sem. Phasellus nunc enim, faucibus ut, laoreet in, consequat id, metus. Vivamus dignissim. Cras lobortis tempor velit. Phasellus nec diam ac nisl lacinia tristique. Nullam nec metus id mi dictum dignissim. Nullam quis wisi non sem lobortis condimentum. Phasellus pulvinar, nulla non aliquam eleifend, tortor wisi scelerisque felis, in sollicitudin arcu ante lacinia leo.', 'the-stocks-are-up', '', 'YES', 'NO', 'YES', 'YES', '', '2009-08-10 04:40:13', '2009-08-10 04:40:13', 'NO', 1, 'YES', 'NO', '')",

				"INSERT INTO `{$_POST['pre']}blog_entry_comments` VALUES(1, 1, NULL, 'Mike Michaels', '', '', 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nunc feugiat. In a massa. In feugiat pharetra lacus. In non arcu nec libero pharetra rutrum. a gravida tristique metus. Na massa.', '2009-08-10 05:57:42', '2009-08-10 06:01:15', 'YES', 'YES', 1)",
				"INSERT INTO `{$_POST['pre']}blog_entry_comments` VALUES(2, 3, NULL, 'Jim Stevens', '', '', 'Nunc feugiat. In non arcu nec libero pharetra rutrum. a gravida tristique metus. N a massa. Lorem ipsum dolor sit amet.', '2009-08-10 05:58:32', '2009-08-10 06:01:14', 'YES', 'YES', 1)",
				"INSERT INTO `{$_POST['pre']}blog_entry_comments` VALUES(3, 1, NULL, 'Buster Brown', '', '', 'In non arcu nec libero pharetra rutrum. a gravida tristique metus. Na massa. Lorem ipsum dolor sit amet, consectetuer adipiscing elit.', '2009-08-10 05:59:06', '2009-08-10 06:01:17', 'YES', 'YES', 1)",
				"INSERT INTO `{$_POST['pre']}blog_entry_comments` VALUES(4, 2, NULL, 'Wanda Lemons', '', '', 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nunc feugiat. In a massa. In feugiat pharetra lacus. In non arcu nec libero pharetra rutrum. a gravida tristique metus.', '2009-08-10 06:00:24', '2009-08-10 06:01:18', 'YES', 'YES', 1)",
				"INSERT INTO `{$_POST['pre']}blog_entry_comments` VALUES(5, 4, NULL, 'Shawn Mist', '', '', 'Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos. Fusce magna mi, porttitor quis, convallis eget, sodales ac, urna. Phasellus luctus venenatis magna. Vivamus eget lacus.', '2009-08-10 06:01:47', '2009-08-10 06:01:47', 'NO', 'YES', 1)",
				"INSERT INTO `{$_POST['pre']}blog_entry_comments` VALUES(6, 3, NULL, 'Mick Wayne', '', '', 'A gravida tristique metus. Na massa. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nunc feugiat. In non arcu nec libero pharetra rutrum. a gravida tristique metus. N a massa. Lorem ipsum dolor sit amet.', '2009-08-10 06:05:58', '2009-08-10 06:06:09', 'YES', 'YES', 1)",

				"INSERT INTO `{$_POST['pre']}data_sets` VALUES(1, 1, 'Team', 'team', 0, '2009-08-10 04:30:21', '2009-08-09 04:48:31')",
				"INSERT INTO `{$_POST['pre']}data_sets` VALUES(2, 1, 'Resources', 'resources', 1, '2009-08-10 04:28:47', '2009-08-10 04:28:25')",

				"INSERT INTO `{$_POST['pre']}data_fields` VALUES(1, 1, 'Name', 'input', 0, 'name')",
				"INSERT INTO `{$_POST['pre']}data_fields` VALUES(2, 1, 'Bio', 'textarea', 1, 'bio')",
				"INSERT INTO `{$_POST['pre']}data_fields` VALUES(3, 1, 'Photo', 'file', 2, 'photo')",
				"INSERT INTO `{$_POST['pre']}data_fields` VALUES(4, 2, 'Resource', 'input', 0, 'resource')",
				"INSERT INTO `{$_POST['pre']}data_fields` VALUES(5, 0, 'URL', 'input', 1, 'url')",
				"INSERT INTO `{$_POST['pre']}data_fields` VALUES(6, 2, 'URL', 'input', 1, 'url')",

				"INSERT INTO `{$_POST['pre']}gallery_categories` VALUES(1, 'Website Galleries', 'NO', 0, '2009-08-09 03:17:00', '2009-08-09 03:17:00', 1, 'website-galleries')",

				"INSERT INTO `{$_POST['pre']}galleries` VALUES(1, 1, 500, 500, 100, 100, 'NO', 'YES', 'YES', 'Website Media', '', '', '2009-08-09 03:17:18', '2009-08-10 03:14:28', 1, 'website-media', 1, NULL, 'NO')",
				"INSERT INTO `{$_POST['pre']}galleries` VALUES(2, 1, 500, 500, 100, 100, 'NO', 'YES', 'YES', 'Blog media', '', '', '2009-08-09 03:17:29', '2009-08-10 03:43:30', 0, 'blog-media', 1, 'IMG6841.jpg', 'NO')",

				"INSERT INTO `{$_POST['pre']}media_items` VALUES(1, 'IMG6877.jpg', 'IMG6877.jpg', 'frt_IMG6877.jpg', 'frp_IMG6877.jpg', 382, 211, 'jpg', '2009-08-10 03:14:28', '2009-08-10 03:14:28', '2009-08-10 03:14:28', NULL, NULL)",
				"INSERT INTO `{$_POST['pre']}media_items` VALUES(2, 'IMG6730.jpg', 'Yosemite 02', 'frt_IMG6730.jpg', 'frp_IMG6730.jpg', 600, 399, 'jpg', '2009-08-10 03:21:05', '2009-08-10 03:43:25', '2009-08-09 00:00:00', NULL, NULL)",
				"INSERT INTO `{$_POST['pre']}media_items` VALUES(3, 'IMG6841.jpg', 'Yosemite 01', 'frt_IMG6841.jpg', 'frp_IMG6841.jpg', 600, 399, 'jpg', '2009-08-10 03:21:05', '2009-08-10 03:43:30', '2009-08-08 00:00:00', NULL, NULL)",
				"INSERT INTO `{$_POST['pre']}media_items` VALUES(4, 'http://vimeo.com/moogaloop.swf?clip_id=1514024&amp;server=vimeo.com&amp;show_title=0&amp;show_byline=0&amp;show_portrait=0&amp;color=00ADEF&amp;fullscreen=1', 'Firerift Commercial', '', '', 500, 282, 'embed', '2009-08-10 03:42:19', '2009-08-10 03:42:19', NULL, '<object width=\"500\" height=\"282\"><param name=\"allowfullscreen\" value=\"true\" /><param name=\"allowscriptaccess\" value=\"always\" /><param name=\"movie\" value=\"http://vimeo.com/moogaloop.swf?clip_id=1514024&amp;server=vimeo.com&amp;show_title=0&amp;show_byline=0&amp;show_portrait=0&amp;color=00ADEF&amp;fullscreen=1\" /><embed src=\"http://vimeo.com/moogaloop.swf?clip_id=1514024&amp;server=vimeo.com&amp;show_title=0&amp;show_byline=0&amp;show_portrait=0&amp;color=00ADEF&amp;fullscreen=1\" type=\"application/x-shockwave-flash\" allowfullscreen=\"true\" allowscriptaccess=\"always\" width=\"500\" height=\"282\"></embed></object>', NULL)",

				"INSERT INTO `{$_POST['pre']}galleries_media_items` VALUES(1, 1, 1, 0, 1)",
				"INSERT INTO `{$_POST['pre']}galleries_media_items` VALUES(2, 2, 2, 2, 1)",
				"INSERT INTO `{$_POST['pre']}galleries_media_items` VALUES(3, 2, 3, 1, 1)",
				"INSERT INTO `{$_POST['pre']}galleries_media_items` VALUES(4, 2, 4, 0, 1)",
				
				"INSERT INTO `{$_POST['pre']}page_categories` VALUES(1, 'Website Pages', 'website-pages', 'NO', 0, '2009-08-09 03:04:27', '2009-08-09 03:04:27', 1)",

				"INSERT INTO `{$_POST['pre']}pages` VALUES(1, '1', 'About Us', 'about-us', '<h2>About Us</h2>\n <p>\n Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nunc feugiat. In a massa. In feugiat pharetra lacus. In non arcu nec libero pharetra rutrum. a gravida tristique metus.\n </p>\n \n <h2>Contact Us</h2>\n <p>\n 123 Main Street<br />\n San Diego, CA 92121<br />\n <br />\n Phone: (000) 000-0000<br />\n Fax: (000) 000-0000<br />\n <a href=\"\">info@yourcompany.com</a>\n </p>', 'NO', 3, '2009-08-09 03:09:01', '2009-08-09 03:09:01', 1)",
				"INSERT INTO `{$_POST['pre']}pages` VALUES(2, '1', 'Welcome', 'welcome', '<h2>Welcome</h2>\n<p>\n Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nunc feugiat. In a massa. In feugiat pharetra lacus. In non arcu nec libero pharetra rutrum. a gravida tristique metus.\n</p>\n<a href=\"{{base_url}}about/\" class=\"btn-learnmore\">Learn More</a>\n \n<h2>Our Services</h2>\n<ul>\n <li>A Service Here</li>\n <li>A Service Here</li>\n <li>A Service Here</li>\n</ul>', 'YES', 2, '2009-08-09 03:09:52', '2009-08-10 02:45:06', 1)",
				"INSERT INTO `{$_POST['pre']}pages` VALUES(3, '1', 'Front Page Header', 'front-page-header', '<div class=\"mid-image\">\n <img src=\"{{base_url}}upload/media/IMG6877~500x500.jpg\" alt=\"IMG6877.jpg\" />\n</div> \n<div class=\"intro\">\n <h1>Main Header</h1>\n <p>\n Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nunc feugiat. In a massa. In feugiat pharetra lacus. In non arcu nec libero pharetra rutrum. a gravida tristique metus.\n <br />\n Na massa. In feugiat pharetra lacus. In feugiat pharetra lacus. In non arcu nec libero pharetra rutrum.\n </p>\n <a href=\"{{base_url}}about/\" class=\"btn-learnmore\">Learn More</a>\n</div>', 'NO', 1, '2009-08-09 03:11:09', '2009-08-10 03:14:52', 1)",
				"INSERT INTO `{$_POST['pre']}pages` VALUES(4, '1', 'Front Page Body', 'front-page-body', '<h1>Main Header</h1>\n<h3>Paragraph Header</h3>\n<p>\n Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nunc feugiat. In a massa. In feugiat pharetra lacus. In non arcu nec libero pharetra rutrum. a gravida tristique metus. N a massa. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nunc feugiat. In a massa. In feugiat <a href=\"http://www.firerift.com\">pharetra lacus</a>. In non arcu nec libero pharetra rutrum. a gravida tristique metus. Na massa. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nunc feugiat. In a massa. In feugiat pharetra lacus. In non arcu nec libero pharetra rutrum. a gravida tristique metus. N a massa. Lorem ipsum dolor sit amet.\n</p>\n<ul>\n <li>Bullet point goes right here.</li>\n <li>Bullet point goes right here.</li>\n <li>Bullet point goes right here.</li>\n</ul>', 'NO', 0, '2009-08-09 03:12:07', '2009-08-10 02:44:11', 1)",

				"INSERT INTO `{$_POST['pre']}records` VALUES(1, 1, 0, '2009-08-10 02:58:28', '2009-08-09 04:51:09')",
				"INSERT INTO `{$_POST['pre']}records` VALUES(2, 1, 1, '2009-08-10 03:03:08', '2009-08-09 04:51:56')",
				"INSERT INTO `{$_POST['pre']}records` VALUES(3, 2, 0, '2009-08-10 04:30:13', '2009-08-10 04:29:08')",
				"INSERT INTO `{$_POST['pre']}records` VALUES(4, 2, 1, '2009-08-10 04:30:02', '2009-08-10 04:29:20')",
				"INSERT INTO `{$_POST['pre']}records` VALUES(5, 2, 3, '2009-08-10 04:29:57', '2009-08-10 04:29:47')",
				"INSERT INTO `{$_POST['pre']}records` VALUES(6, 2, 2, '2009-08-10 04:31:41', '2009-08-10 04:31:35')",

				"INSERT INTO `{$_POST['pre']}record_values` VALUES(1, 1, 1, 'John Doe')",
				"INSERT INTO `{$_POST['pre']}record_values` VALUES(2, 1, 2, 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nunc feugiat. In a massa. In feugiat pharetra lacus. In non arcu nec libero pharetra rutrum. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nunc feugiat. In a massa. In non arcu nec libero pharetra rutrum.')",
				"INSERT INTO `{$_POST['pre']}record_values` VALUES(3, 1, 3, 'team-image.jpg')",
				"INSERT INTO `{$_POST['pre']}record_values` VALUES(4, 2, 1, 'Jane Smith')",
				"INSERT INTO `{$_POST['pre']}record_values` VALUES(5, 2, 2, 'Nunc feugiat. In a massa. In feugiat pharetra lacus. In non arcu nec libero pharetra rutrum. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nunc feugiat. In a massa. In feugiat <a href=\"http://www.firerift.com/\">pharetra lacus</a>. In non arcu nec libero pharetra rutrum. a gravida tristique metus.')",
				"INSERT INTO `{$_POST['pre']}record_values` VALUES(7, 3, 4, 'Valio, Inc.')",
				"INSERT INTO `{$_POST['pre']}record_values` VALUES(8, 3, 6, 'http://www.valioinc.com/')",
				"INSERT INTO `{$_POST['pre']}record_values` VALUES(6, 2, 3, 'team-image1.jpg')",
				"INSERT INTO `{$_POST['pre']}record_values` VALUES(9, 4, 4, 'Firerift')",
				"INSERT INTO `{$_POST['pre']}record_values` VALUES(10, 4, 6, 'http://www.firerift.com/')",
				"INSERT INTO `{$_POST['pre']}record_values` VALUES(11, 5, 4, 'Fullsize jQuery Plugin')",
				"INSERT INTO `{$_POST['pre']}record_values` VALUES(12, 5, 6, 'http://www.addfullsize.com/')",
				"INSERT INTO `{$_POST['pre']}record_values` VALUES(13, 6, 4, 'CoViews')",
				"INSERT INTO `{$_POST['pre']}record_values` VALUES(14, 6, 6, 'http://covie.ws/')"
			);

	  	//add gallery_category/gallery/media_items
			foreach ($sql as $cmd) {
				mysql_query($cmd);
			}
			
			$images = array('IMG6877.jpg', 'IMG6730.jpg', 'IMG6841.jpg');
			foreach ($images as $image) {
				copy("../misc/template/images/$image", mediaPath($image));
				createthumb(mediaPath($image),mediaPath("frt_{$image}"),150,100);
				createthumb(mediaPath($image),mediaPath("frp_{$image}"),800,600);
				@chmod(mediaPath($image),0777);
				@chmod(mediaPath("frt_{$image}"),0777);
				@chmod(mediaPath("frp_{$image}"),0777);
			}
			
			if (!is_dir("../upload/data/1/")) {
				mkdir("../upload/data/1/");
				@chmod("../upload/data",0777);
			}
			copy("../misc/template/images/team-image.jpg", "../upload/data/1/team-image.jpg");
			@chmod("../upload/data/1/team-image.jpg",0777);
			copy("../misc/template/images/team-image.jpg", "../upload/data/1/team-image1.jpg");
			@chmod("../upload/data/1/team-image1.jpg",0777);
			
			mysql_close();
			
			@chmod("../public",0755);
	  }
	  	
	}
  echo "{success: true}";
	} else {
		error("Key failed");
	}
} else {
	error("Missing some information");
}

?>