
var logging = false;     // set to true, if want visible logging on the page.
var gpsParams, longValue, latValue, dirValue, accuracyValue;
var getBlobStoreURLEndPoint, processNewImgEndPoint, localPictureURL, imgFileName, imgTitleVal, getPhotoStackSinglePhotoPoint;
var docObj;
var lastclickpoint, curclickpoint; // used to fix tab bug - see: http://forum.jquery.com/topic/tap-fires-twice-with-live-tap
var liItems;
var userImgDataStoreID = 0;
var loaderAnim;
var imgTitleMaxChar = 25;

/////////
//Initialisation code:

getBlobStoreURLEndPoint = "http://histographserver.appspot.com/getblobstoreurl";
getPhotoStackSinglePhotoPoint = "http://histographserver.appspot.com/getsinglehistographimages";
selectedImgIdsEndPoint = "http://histographserver.appspot.com/makehistograph";

docObj = $(document);// cache calls to the DOM.
docObj.ready(function () {
	
	//on start up - send GPS of device to server and use callback func to receive imgs of that location from server
	navigator.geolocation.getCurrentPosition(onGeoLocationSuccess,onGeoLocationError);

	loaderAnim = $('#developingLoader');
	
	
/////////
	//animateLoader();
	//var intervalID = setInterval(runIt, 4000);
});
function animateLoader() {
	loaderAnim.animate({opacity:'+=1'}, 1500);
	loaderAnim.animate({opacity:'-=0.6'}, 1500);
}

////////
//function animate(elementID){
//    //$(elementID).fadeIn(1000).delay(3000).fadeOut(1000);  
//	$('#developingLoader').fadeIn(1000).delay(3000).fadeOut(1000); 
//}

///////
//Camera code:

//event handler for when user clicks on intro screen btn
function capturePhoto() {
	//bug: when loading new image stack page - we see the welcome page for a few seconds, then the image stack page - after camera...
	// fix: ? - load a ""holding page - that just says "Developing" here... so this MAY get shown when we actually want to move to the image stack..??
	
	// dont know if i need this here....?? - now it just gives a flash... call it after get image title pagge???
	$.mobile.changePage($('#blankBlackPage'), 'slide');

	
	
	
	//see: http://docs.phonegap.com/en/2.2.0/cordova_camera_camera.md.html#camera.getPicture
	navigator.camera.getPicture(onCameraSuccess, onCameraFail, {
		quality : 75, // tested a few settings here: size/quality ratio - 75 is best.
		destinationType : navigator.camera.DestinationType.FILE_URI,
		sourceType : navigator.camera.PictureSourceType.CAMERA,
		encodingType :   Camera.EncodingType.JPEG, 
		targetWidth : 450, // 300 x 300 px - suited to polaroid format. - but comes out at: 225 x 300... might just be my phone... //Made this 450x450 - as imgs come out in a rectangle - want both sides to be at least 300 - then can make crop easier
		targetHeight : 450,// 400 x 400 - comes out good quality to size ratio.. when quality is at 75.
		saveToPhotoAlbum: true // so that we can reference this img locally, for the local stack of polaroids.
	});
	

}

function onCameraSuccess(imageURI) {
	//runIt();// do loading page animation..
	//assign location & name of the img taken by user to global vars, for use later:
	
	localPictureURL = imageURI;
	imgFileName = localPictureURL.substr(localPictureURL.lastIndexOf('/') + 1);
	
	//New: get user to enter title for the img just taken... and move rest of the code - to THAT event handler... =  imgTitleEntered()
	$.mobile.changePage($('#enterImgTitlePage'), 'slide');
	
	
//	for(var i = 0; i<10;i++){
//		animateLoader();
//	}
//	localPictureURL = imageURI;
//	imgFileName = localPictureURL.substr(localPictureURL.lastIndexOf('/') + 1);
//
//	// get the one time blobstore URL to post img to...
//	$.get(getBlobStoreURLEndPoint, blobStoreURLSuccess);

	// if we want to access the img locally.... ie: put it on top of the stack
//	var smallImage = document.getElementById('smallImage');
//	smallImage.style.display = 'block';
//	smallImage.src = imageURI; //Originally: smallImage.src = "data:image/jpeg;base64," + imageURI;
	//////////////////////////

}
//This posts img and assoc'd params to post URL/End point, returned by Blobstore...
function blobStoreURLSuccess(blobStoreURL){

	//Moved this....
	//$.mobile.changePage($('#scrollStackPage'), 'slide');

	var options = new FileUploadOptions();
	var ft = new FileTransfer();
	var params = new Object();
	
	params.imgTitle = imgTitleVal;
	params.uniquePhoneID = device.uuid; 
	params.lat = latValue; //TODO: get GPS lat
	params.long  = longValue; //TODO: get GPS long
	params.direction = "400";//TODO: get compass direction
	// this should set the param "imgUpload" as the img file name, as required by our callback servlet 
	//params.imgUpload = imgFileName; // - doesnt seem to be used - callback servlet - just needs to ask for param 'file' value.

	options.params = params;
	options.fileName = imgFileName;  
	options.mimeType = "image/jpeg"; 

	ft.upload(localPictureURL, encodeURI(blobStoreURL), fileUploadSuccess, fileUploadFail, options);
	// while the user img is uploading, show the user the image stack of... their current img on top, and the historical imgs of that location....
	//OK- still showing original welcome screen.. need to add another page - that loads between welcome page and camera page, which then
	//	reappears btwn user taking photo with native camera and the stack page....
	// could be the backwards clock animated gif??



}

function onCameraFail(message) {
	alert('Failed because: ' + message);
	
}


function fileUploadSuccess(r) {
	
	// save the dataStore ID of the img the user just uploaded....
	userImgDataStoreID = r.response;
	//alert("userImgDataStoreID = " + userImgDataStoreID);
	
	//TODO: this is a problem...
	$.mobile.changePage($('#scrollStackPage'), 'slide'); 
	// clearInterval(intervalID); // kill flashing loader page
	// go straight to the scroll stack page??
	// - or have a little info pop up, if the user has not submitted a histograph b4? - can check from response 
	//	from server - 
	// this seems to get called really late.... after all the files are uploaded.. dont need to do that-  just call straight after ft.upload...
	//$.mobile.changePage($('#scrollStackPage'), 'slide');
	//document.getElementById('testDiv3').innerHTML = "Success = "+ r.response;
	//TODO:
	// now automatically display the stack of imgs? with local file on top?
}

function fileUploadFail(error) {
	//document.getElementById('testDiv3').innerHTML = "Failed = "+ error.code;
}

//end camera code
/////////

//Run after successful transaction- append the position data to the string
function onGeoLocationSuccess(position) {

	if(logging)
		$("#geolocationData").html( "onGeoLocationSuccess()");

	// assign global GPS vars for use later:
	longValue = position.coords.longitude;
	latValue= position.coords.latitude; 
	dirValue= 450;
	accuracyValue = position.coords.accuracy;

//	// can not get this to work on my android.... for the moment, just go with GPS.
//	gpsParams += "&dir=450"; // this will be flagged as an error when it hits the server
//	//navigator.compass.getCurrentHeading(onCompassSuccess, onCompassError);

	postGPSToServer();
}

//Run if we face an error
//obtaining the position data
function onGeoLocationError(error) {

	if(logging)
		$("#geolocationData").html( "onGeoLocationError()");

	var errString = '';
	// Check to see if we have received an error code
	if (error.code) {
		// If we have, handle it by case
		switch (error.code) {
		case 1: // PERMISSION_DENIED
			errString = 'Unable to obtain the location information because the device does not have permission to the use that service.';
			break;
		case 2: // POSITION_UNAVAILABLE
			errString = 'Unable to obtain the location information because the device location could not be determined.';
			break;
		case 3: // TIMEOUT
			errString = 'Unable to obtain the location within the specified time allocation.';
			break;
		default: // UNKOWN_ERROR
			errString = 'Unable to obtain the location of the device due to an unknown error.';
		break;
		}
	}
	// Handle any errors we may face

	geoLocationErrorAlert(errString);

	if(logging){
		locationParamsString += "Error=" + errString;
		$("#geolocationData").html( "locationParamsString");
	}

}

function onCompassSuccess(heading) {

	if(logging){
		$("#geolocationData").html( "onCompassSuccess()");
	}

	locationParamsString += "dir=" + heading.magneticHeading;
	postGPSToServer();

}


function onCompassError(compassError) {

	if(logging){
		$("#geolocationData").html( "onCompassError()");
	}

	// Just pass a value greater than 360, so server knows there's an error:
	locationParamsString += "dir=400";

	postGPSToServer();

}

function postGPSToServer(){

	//NEW:
	//this works
	$.get(getPhotoStackSinglePhotoPoint, {lat : latValue, long : longValue, dir : dirValue, accuracy : accuracyValue}, 
			function(responseText){ // callback function - appends list of imgs to imageStack div and sets up the animation of poloriods
		//OLD CODE
		//$('#imageStack').append(responseText).html;
		//NEW CODE:
		//alert("postGPSToServer() response text:" + responseText);
		
		//TODO: before we append the text - make sure there is something come back
		//	else - display an error msg - in this case - its likely there's no imgs or problem with the server / network
		//alert(responseText);
		$('#imageStack').append(responseText).html;
		initAnim();
		$.mobile.loadPage('#scrollStackPage');
	});
}


function geoLocationErrorAlert(errorMsg) {
	//TODO: this is not working for some reason - not getting alerts on phone...
	navigator.notification.alert(errorMsg);

}


function initAnim(){

	var rotation;
	liItems = $("#imageStack ul li"); // cache calls to the DOM
	var flip = true;

	//init positions:
	liItems.each(function(){

		if(flip){
			rotation = 0.6;
			flip = false;
		}else{
			rotation = -0.8;
			flip = true;
		}

		$(this).data("rotation",rotation);
		$(this).css({webkitTransform:"rotate("+rotation+"deg)",MozTransform:"rotate("+rotation+"deg)",msTransform:"rotate("+rotation+"deg)",transform:"rotate("+rotation+"deg)"});
		$(this).bind("tap", imageTapped);
	});
}

function imageTapped(event){

	if(isJqmGhostClick(event) ){
		return;
	}
		
	
	if(event.target instanceof HTMLImageElement){
		var thisObj = $(this);

		if(thisObj.hasClass('selected')){
			
			//the first li, is having its tick removed automatically...
			//alert("in Has Selected class")
			thisObj.removeClass('selected');
			thisObj.children().eq(0).remove();

		}else{
			//alert("in Has NOT Selected class")
			thisObj.addClass('selected');
			thisObj.prepend("<img src='img/tick.png' class='tick'>");

		}
	}

}

//deal with double tap bug - http://forum.jquery.com/topic/tap-fires-twice-with-live-tap
//check if click event firing twice on same position.
function isJqmGhostClick(event){
    curclickpoint = event.clientX+'x'+event.clientY;
    if (lastclickpoint === curclickpoint) {
      lastclickpoint = '';
      return true;
    } else {
      lastclickpoint = curclickpoint;
      return false;
    }
}

//Sends ID's of the images that the user has selected back to the server.
function makeHistograph(){
	
	$.mobile.changePage($('#developingPage'), 'slide');
	for(var i = 0; i<10;i++){
		animateLoader();
	}
	//alert("In makeHistograph. userImgDataStoreID = " + userImgDataStoreID);

	// hopefully - can use the unique phone id instead of session...
	var uniquePhoneIDVal = device.uuid;
	var imgidsVals = userImgDataStoreID + "_"; // at v least we'll get back the img the user took with the phone...
	
	var liItems = $("#imageStack ul li"); // cache calls to the DOM
	
	liItems.each(function(){

		var thisObj = $(this);
		if(thisObj.hasClass('selected')){
			var id = thisObj.find('.photoInfo').attr('id');
			imgidsVals += id + "_";
		}
	});
	
	////////////////
	// first version:
//	$.get(selectedImgIdsEndPoint, {uniquePhoneID : uniquePhoneIDVal, imgids : imgidsVals}, 
//			function(response){ // callback function - appends list of imgs to imageStack div and sets up the animation of poloriods
//	
//		//TODO: append the jpg to some element in the checkHisto page...
//		$('#histographImg').attr("src", "data:image/jpeg;base64,"+ response); // histographImg is a div we will inject the whole server side img code into... whose src is a serving url of the composite img
////		initAnim();
////		$.mobile.changePage($('#scrollStackPage'), 'slide'); 
//		// 
//
//		// finally - move to checkHistoPage
//		$.mobile.changePage($('#checkHistoPage'), 'slide');
//	});
	//
	/////////////////
	
	///////////////
	// 2nd version:
	
	$('#histographImg')
	.load(function(){
		$.mobile.changePage($('#checkHistoPage'), 'slide');
	});
	
	$('#histographImg').attr("src", selectedImgIdsEndPoint + "?" + "imgids=" + imgidsVals);
	
	
	//$.mobile.changePage($('#checkHistoPage'), 'slide');
	//
	//////////
	
	
	
}

function imgTitleEntered(){
	
	$.mobile.changePage($('#developingPage'), 'slide');
	
	for(var i = 0; i<20;i++){
		animateLoader();
	}
	
	// now we have the img... get the img title entered by the user...

	//$.mobile.changePage($('#scrollStackPage'), 'slide');
	
	imgTitleVal= $('#imgTitle').val(); // get the img title entered by the user...
	//alert("imgTitleVal: " + imgTitleVal);
	
	// get the one time blobstore URL to post img to...
	$.get(getBlobStoreURLEndPoint, blobStoreURLSuccess);
	
}



	
