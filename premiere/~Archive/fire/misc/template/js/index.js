$(function(){
	if(/\/about\//.test($.url.attr("source"))){
		$("ul.nav li.nav-about").addClass("active");
	} else if(/\/blog\//.test($.url.attr("source"))){
		$("ul.nav li.nav-blog").addClass("active");
	} else {
		$("ul.nav li.nav-home").addClass("active");
	}
	$("#searchfield").focus(function(){
		if($(this).val() == "Search The Blog"){ $(this).val(""); }
	}).blur(function(){
		if($(this).val() == ""){ $(this).val("Search The Blog"); }
	});
});

frSuccess = function(){

}
