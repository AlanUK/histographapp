var testLclSrvr = false; // set true if working on local server 
var logging = false;     // set to true, if want visible logging on the page.
var postGPSEndPoint, gpsParams, long, lat, direction, accuracy;
var getBlobStoreURLEndPoint, processNewImgEndPoint, localPictureURL, imgFileName;

/////////
// Initialisation code:
if(testLclSrvr){
	postGPSEndPoint = "http://localhost:8080/gethistographimages";
	getBlobStoreURLEndPoint = "http://10.0.2.2:8080/getblobstoreurl"; //"http://10.0.2.2:8080/upload.jsp"; - if using file upload.. & not ajax

}else{
	postGPSEndPoint = "http://histographserver.appspot.com/gethistographimages";
	getBlobStoreURLEndPoint = "http://histographserver.appspot.com/getblobstoreurl";
}

$(document).ready(function () {navigator.geolocation.getCurrentPosition(onGeoLocationSuccess,onGeoLocationError);});
//document.addEventListener("deviceready", onDeviceReady, false); //this is what your SUPPOSED to use in Phonegap - but looks like jquery's document call is a bit later


// Run after successful transaction- append the position data to the string
function onGeoLocationSuccess(position) {
	
	if(logging)
		$("#geolocationData").html( "onGeoLocationSuccess()");
	
	// assign global GPS vars for use later:
	long = position.coords.longitude;
	lat= position.coords.latitude; 
	direction= 450;
	accuracy = position.coords.accuracy;

	// and appending to query string:
	gpsParams = "&lat=";
	gpsParams += lat;
	gpsParams += "&long=";
	gpsParams += long;
	gpsParams += "&accuracy=";
	gpsParams += accuracy;
	
	// can not get this to work on my android.... for the moment, just go with GPS.
	gpsParams += "&dir=450"; // this will be flagged as an error when it hits the server
	//navigator.compass.getCurrentHeading(onCompassSuccess, onCompassError);
	
	postGPSToServer();
}

// Run if we face an error
// obtaining the position data
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
	
	postGPSEndPoint += "?" + gpsParams;
	
	if(logging){
		$("#geolocationData").html(postGPSEndPoint);
	}
	//4. JSON: simple: -This works on phone - just need to ..init via: $(document).ready(function () {onDeviceReady();});
	$.ajax({
	       type: 'GET',
	        url: postGPSEndPoint,
	        async: false,
	        contentType: "application/json",
	        dataType: 'jsonp'
	    });

}

function geoLocationErrorAlert(errorMsg) {
	//TODO: this is not working for some reason - not getting alerts on phone...
	navigator.notification.alert(errorMsg);
	
}

///////
// Camera code:

// event handler for when user clicks on intro screen btn
function capturePhoto() {
	//see: http://docs.phonegap.com/en/2.2.0/cordova_camera_camera.md.html#camera.getPicture
	navigator.camera.getPicture(onCameraSuccess, onCameraFail, {
		quality : 75, // tested a few settings here: size/quality ratio - 75 is best.
		destinationType : navigator.camera.DestinationType.FILE_URI,
		sourceType : navigator.camera.PictureSourceType.CAMERA,
		encodingType :   Camera.EncodingType.JPEG,
		targetWidth : 400, // 300 x 300 px - suited to polaroid format. - but comes out at: 225 x 300... might just be my phone...
		targetHeight : 400,// 400 x 400 - comes out good quality to size ratio.. when quality is at 75.
		saveToPhotoAlbum: true // so that we can reference this img locally, for the local stack of polaroids.
	});
}


function onCameraSuccess(imageURI) {
	
	//assign location & name of the img taken by user to global vars, for use later:
	localPictureURL = imageURI;
	imgFileName = localPictureURL.substr(localPictureURL.lastIndexOf('/') + 1);
	
	// get the one time blobstore URL to post img to...
	$.get(getBlobStoreURLEndPoint, blobStoreURLSuccess);
	
	// if we want to access the img locally.... ie: put it on top of the stack
//	var smallImage = document.getElementById('smallImage');
//	smallImage.style.display = 'block';
//	smallImage.src = imageURI; //Originally: smallImage.src = "data:image/jpeg;base64," + imageURI;
	//////////////////////////
	
}
//This posts img and assoc'd params to post URL/End point, returned by Blobstore...
function blobStoreURLSuccess(blobStoreURL){

	var options = new FileUploadOptions();
	var ft = new FileTransfer();
	var params = new Object();

	params.uniquePhoneID = device.uuid; 
	params.lat = lat; //TODO: get GPS lat
	params.long  = long; //TODO: get GPS long
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
	
	$.mobile.changePage($('#scrollStackPage'), 'slide');

}

function onCameraFail(message) {
	alert('Failed because: ' + message);
}


function fileUploadSuccess(r) {
	
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

// end camera code
/////////
