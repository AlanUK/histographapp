
var longValue, latValue, dirValue, accuracyValue; // GPS data vars
var localPictureURL, imgFileName, imgTitleVal; // image related vars
var lastclickpoint, curclickpoint; // used to fix tab bug - see: http://forum.jquery.com/topic/tap-fires-twice-with-live-tap
var liItems; // the list of images the user will select from
var userImgDataStoreID = 0; // the datastore ID of the image the user has taken using camera
var loaderAnim; // cached DOM object: the div with the "Developing.. Please Wait" text in it
var imgTitleMaxChar = 25; // Any image title longer than this is simply shortened
var isHistoGraph = 'false'; // flag for server
var fileUploaded = false; // when set to true we can make histograph
var histographURL; // the final shortened, serving url of the user created histograph - can then be shared.
var postingURL; // will either be set to twitter or facebook URL - depending upon what user has chosen.
var placeHolderText = '***REQUIRED***'; // form item
var postcardMsg; // user entered post card msg
var contactName, contactStreet, contactCity, contactStateCounty, contactPostalCode, contactCountry; // postcard recipient details
var uniquePhoneIDVal; // unique device id for this device - used instead of session tracking...
var userHasEmail = false; // flag for prompting user for their email

// Text for User's Social channels
var clipBoardText;
var clipBoardTextTwitterPre = 'Made a Histograph at Brighton Digital Festival ';
var clipBoardTextTwitterPost = ' #BDF2013 - http://bit.ly/16Ckdj0';
var clipBoardTextFBpre = 'Made a Histograph at Brighton Digital Festival ';
var clipBoardTextFBpost = '.   Histograph - http://www.brightondigitalfestival.co.uk/events/histograph/';
var userPostInstructions = 'You will be redirected to you personal account. '+
		  				   'We have pasted all you need on your clipboard, just paste it in a new message and post. ' +
		  				   'Click \'Done\' to return to this screen and post your Histograph in another way.';

/////////
//Init server URLs
var getBlobStoreURLEndPoint 		= "http://histographserver.appspot.com/getblobstoreurl";
var getPhotoStackSinglePhotoPoint 	= "http://histographserver.appspot.com/getsinglehistographimages";
var makeHistographEndPoint 			= "http://histographserver.appspot.com/makehistograph";
var postcardEndPoint 				= "http://histographserver.appspot.com/postcardservlet"; 
var checkUserAccountEndPoint		= "http://histographserver.appspot.com/checkuseraccount";
var updateUserEndPoint				= "http://histographserver.appspot.com/updateuserdetails";
var userAccountDetailsEndPoint		= "http://histographserver.appspot.com/useraccountdetails";
///////////


// init:
$(document).ready(function () {
	
	//on start up - send GPS of device to server and use callback func to receive imgs of that location from server
	navigator.geolocation.getCurrentPosition(onGeoLocationSuccess,onGeoLocationError);

	loaderAnim = $('#developingLoader'); // cache DOM calls

	
	// set flag, that this image IS a Histograph, when this page is shown..
	$('#shareHistoPage').live('pageshow', function(){ postHistograph();});
	
	//check if user has an email set up on the server, when this page appears -
	$('#shareHistoPage').live('pageshow', function(){ checkUserAccount();}); 
	
	// when user accesses accounts page, pull their most recent orders, histograph details, etc from server
	$('#accountPage').live('pageshow', function(){ updateAccountDetails();}); 
	
	// when we have the histograph image loaded from server - slide its page into view
	$('#histographImg').load(function() {
		$.mobile.changePage($('#checkHistoPage'), 'slide');
		});
	

	
	
});

// called when user has posted histograph postcard and wants to make another one:
function clearVarsAndStartAgain(){
	imgTitleVal = '';
	$('#imgTitle').val(''); 
	$('#editSearch').val(''); 
	$('#postCardMsg').val(''); 
	postCardMsg = '';
	$.mobile.changePage($('#welcomePage'), 'slide'); 
}



///////
//Camera code:

//event handler for when user clicks on intro screen btn
function capturePhoto() {

	// dont know if i need this here....?? - now it just gives a flash... call it after get image title pagge???
	//$.mobile.changePage($('#blankBlackPage'), 'slide');
	$.mobile.changePage($('#enterImgTitlePage'), 'slide'); 
	
	//see: http://docs.phonegap.com/en/2.2.0/cordova_camera_camera.md.html#camera.getPicture
	navigator.camera.getPicture(onCameraSuccess, onCameraFail, {
		quality : 75, // tested a few settings here: size/quality ratio - 75 is best.
		destinationType : navigator.camera.DestinationType.FILE_URI,
		sourceType : navigator.camera.PictureSourceType.CAMERA,
		encodingType :   Camera.EncodingType.JPEG, 
		targetWidth : 450, // 300 x 300 px - suited to polaroid format. - but comes out at: 225 x 300... might just be my phone... //Made this 450x450 - as imgs come out in a rectangle - want both sides to be at least 300 - then can make crop easier
		targetHeight : 450,// 400 x 400 - comes out good quality to size ratio.. when quality is at 75.
		saveToPhotoAlbum: false // no need to save this img locally
	});
}

function onCameraSuccess(imageURI) {
	//assign location & name of the img taken by user to global vars, for use later:
	
	localPictureURL = imageURI;
	imgFileName = localPictureURL.substr(localPictureURL.lastIndexOf('/') + 1);
	isHistoGraph = "false";

}
//This posts img and assoc'd params to post URL/End point, returned by Blobstore...
// called once when the user has taken first photo from camera phone
// and called second time when posting histograph back to server for persistence

function blobStoreURLSuccess(blobStoreURL){

	var options = new FileUploadOptions();
	var ft = new FileTransfer();
	var params = new Object();
	
	params.is_histograph = isHistoGraph; // this is set to false when we are just sending regular photo and set to true when sending histograph
	params.imgTitle = imgTitleVal;
	params.uniquePhoneID = device.uuid; 
	params.lat = latValue; 
	params.long  = longValue;
	params.direction = "400";//TODO: get compass direction - this isnt working on my phone - so will leave for this iteration...
	// this should set the param "imgUpload" as the img file name, as required by our callback servlet 
	//params.imgUpload = imgFileName; // - doesnt seem to be used - callback servlet - just needs to ask for param 'file' value.

	options.params = params;
	options.fileName = imgFileName;  
	options.mimeType = "image/jpeg"; 

	ft.upload(localPictureURL, encodeURI(blobStoreURL), fileUploadSuccess, fileUploadFail, options);

}

function onCameraFail(message) {
	// just go back home ...
	$.mobile.changePage($('#welcomePage'), 'slide'); 
	
}


function fileUploadSuccess(r) {
	
	// save the dataStore ID of the img the user just uploaded....
	userImgDataStoreID = r.response;
	
	// Now let user select images pulled from the server...
	$.mobile.changePage($('#scrollStackPage'), 'slide'); 
}

function fileUploadFail(error) {
	
	alert("Problem Developing Image: " + error.code);
	capturePhoto(); // and go take another photo
}

//end camera code
/////////

/////////
// Geolocation code:
//Run after successful transaction- append the position data to the string
function onGeoLocationSuccess(position) {

	// assign global GPS vars for use later:
	longValue = position.coords.longitude;
	latValue= position.coords.latitude; 
	dirValue= 450;
	accuracyValue = position.coords.accuracy;
	postGPSToServer();
}

//Run if we face an error obtaining the position data
function onGeoLocationError(error) {

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
	geoLocationErrorAlert(errString);
}

function onCompassSuccess(heading) {

	locationParamsString += "dir=" + heading.magneticHeading;
	postGPSToServer();
}


function onCompassError(compassError) {

	// Just pass a value greater than 360, so server knows there's an error:
	locationParamsString += "dir=450";

	postGPSToServer();

}

function postGPSToServer(){

	$.get(getPhotoStackSinglePhotoPoint, {lat : latValue, long : longValue, dir : dirValue, accuracy : accuracyValue}, 
			function(responseText){ // callback function - appends list of imgs to imageStack div and sets up the animation of poloriods
									$('#imageStack').append(responseText).html;
									initAnim();
									$.mobile.loadPage('#scrollStackPage');
	});
}


function geoLocationErrorAlert(errorMsg) {
	alert("Problem getting your location data: " + errorMsg);
}

// geolocation code end
////////

///////////
// UI code:
// adds a slight rotation to the polaroid images
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

//fades 'loading/ developing' text in and out...
function animateLoader() {
	loaderAnim.animate({opacity:'+=1'}, 1500);
	loaderAnim.animate({opacity:'-=0.6'}, 1500);
}



function imageTapped(event){

	if(isJqmGhostClick(event) ){
		return;
	}
		
	
	if(event.target instanceof HTMLImageElement){
		var thisObj = $(this);

		if(thisObj.hasClass('selected')){
			thisObj.removeClass('selected');
			thisObj.children().eq(0).remove();
		}else{
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

// end UI Code
////////////

/////////////
//histograph code

//set true flag
function postHistograph(){
	isHistoGraph = "true";
}

//Sends ID's of the images that the user has selected back to the server.
// and return a serving URL of the newly created image
function makeHistograph(){
	
	$.mobile.changePage($('#developingPage'), 'slide');
	for(var i = 0; i<10;i++){
		animateLoader();
	}
		
	// hopefully - can use the unique phone id instead of session... need to check this works in iphone
	uniquePhoneIDVal = device.uuid;
	var imgidsVals = userImgDataStoreID + "_"; // at v least we'll get back the img the user took with the phone...
	
	liItems = $("#imageStack ul li"); // cache calls to the DOM
	
	liItems.each(function(){

		var thisObj = $(this);
		if(thisObj.hasClass('selected')){ // run through list of imgs, if selected by user add their datastore ID to the param list
			var id = thisObj.find('.photoInfo').attr('id');
			imgidsVals += id + "_";
		}
	});
	
	$.get(makeHistographEndPoint, {uniquePhoneID : uniquePhoneIDVal, 
								   imgids : imgidsVals, 
								   is_histograph : 'true',
								   imgTitle : imgTitleVal,
								   lat : latValue,
								   long : longValue,
								   direction : '450'}, 
			function(response){ // callback function - appends list of imgs to imageStack div 
		histographURL = response; // and gets the shortened URL from server...

		$('#histographImg').attr("src", histographURL); // histographImg is a div we will inject the whole server side img code into... whose src is a serving url of the composite img
		// finally - move to checkHistoPage
		// moved this to int - so it only happens when page is loaded 
		// $.mobile.changePage($('#checkHistoPage'), 'slide');
	});
	
}

function imgTitleEntered(){

	$.mobile.changePage($('#developingPage'), 'slide');
	
	for(var i = 0; i<20;i++){
		animateLoader();
	}
		
	imgTitleVal= $('#imgTitle').val(); // get the img title entered by the user...

	// get the one time blobstore URL to post img to...
	$.get(getBlobStoreURLEndPoint, blobStoreURLSuccess);
}
// histograph code end
////////////

//////////
// Social / Post card code:

// sets up the twitter URL to open in the inAppBrowser and pastes twitter text onto user's dashboard
//then loads the user instructions about pasting clipboard into new tweet
// ref: https://dev.twitter.com/docs/intents#tweet-intent
function loadTwitter(){
	
	var twitterText = clipBoardTextTwitterPre + histographURL + clipBoardTextTwitterPost;
	
	window.clipboardManagerCopy(twitterText, function(r){/*alert("Copied " + clipBoardTextTwitter + "OK");*/}, function(e){alert(e);});
	postingURL = 'https://twitter.com/intent/tweet';
	$.mobile.changePage($('#postInstructions'), {transition: 'pop', role: 'dialog'});
}

//sets up the facebook URL to open in the inAppBrowser and pastes facebook text onto user's dashboard
// then loads the user instructions about pasting clipboard into new facebook post
function loadFacebook(){
	
	var fbText = clipBoardTextFBpre + histographURL + clipBoardTextFBpost;
	
	window.clipboardManagerCopy(fbText, function(r){/*alert("Copied " + clipBoardTextTwitter + "OK");*/}, function(e){alert(e);});
	postingURL = 'https://www.facebook.com/'; // now postingURL is used in opening new window to user's personal account..
	$.mobile.changePage($('#postInstructions'), {transition: 'pop', role: 'dialog'});
}

// pulls whatever text user has entered in the "Search Contacts" text box, and creates an UL list of 
// contacts who have those letters in their name
//Ref: Phonegap Essentials 2012: pp:264-266.
function searchContacts() {
	
	// let user know what system is doing... 
	$('#contactsListDiv').html('<p class=\"white_text histo_font_24 centre_text\"> Searching Contacts...</p> ');
	
	var contactFields = [];

    //Get the search string from the page
    var searchStr = document.getElementById("editSearch").value;
    
    //remove any spaces from beginning & end - search sensitive to that
    // ref: http://stackoverflow.com/questions/3000649/trim-spaces-from-start-and-end-of-string
    searchStr = searchStr.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

    contactFields = ['displayName', 'name', 'nickname', 'addresses'];

    //Populate the search options object
    var searchOptions = { filter : searchStr, multiple : true };
    
    //Execute the search
    navigator.contacts.find(contactFields, onContactSearchSuccess, onContactSearchError, searchOptions);
}

//Ref: Phonegap Essentials 2012: pp:264-266.
function onContactSearchSuccess(contacts) {
	 
	  //Populate the contact list element of the contact list page
	  var i, len, theList;
	  //Store the contact data in our global variable so the other functions have something to work with
	  contactList = contacts;
	  //Did we get any results from the search?
	  len = contacts.length;
	  if(len > 0) {
	    theList = '<p class=\"white_text histo_font_24 centre_text\">Tap Contact To Select:</p> <ul id="contactsList" data-role="listview">';
	    for( i = 0, len; i < len; i += 1) {
	      //on iOS displayName isn't supported, so we can't
	      //use it
	      if(contacts[i].displayName == null) {
	        theList += '<li><a onclick="showContact(' + i +
	          ');">' + contacts[i].name.familyName + ", " +
	          contacts[i].name.givenName + '</a></li>';
	      } else {
	        theList += '<li><a onclick="showContact(' + i +
	          ');">' + contacts[i].displayName + '</a></li>';
	      }
	    }
	    theList += '</ul>';
	    $('#contactsListDiv').html(theList);
	  } else {
		  $('#contactsListDiv').html('<p class=\"white_text histo_font_18 centre_text\">Search returned 0 results </p>');
	  }
}

// here we present the selected contact's details in the contactEntryPage
//Ref: Phonegap Essentials 2012: pp:264-266.
function showContact(index) {
    var len, i;

    //get a handle to the selected contact
    var contact = contactList[index];

    //First set the header content for the page to match the
    //contact's full name
    //Unfortunately iOS doesn't use displayName, so this had
    // to be rewritten
    
    if(contact.displayName == null) {
    	$('#name').val(contact.name.givenName + " " + contact.name.familyName);
    } else {
    	$('#name').val(contact.displayName);
    }
    
    $('#street1').val(contact.addresses[0].streetAddress); 
    $('#city').val(contact.addresses[0].locality); 
    $('#stateCounty').val(contact.addresses[0].region); 
    $('#postalCode').val(contact.addresses[0].postalCode); 
    $('#country').val(contact.addresses[0].country); 
 
    var dt;
    for(myKey in contact) {
      dt += "Contact[" + myKey + "] = " + contact[myKey] + "<br/>";
    }
    
    //Then switch to the Contact Details page
    $.mobile.changePage("#contactEntryPage", "slide", false, true);
  }

function onContactSearchError(e) {
    var msgText;
    //Now build a message string based upon the error
    //returned by the API
    switch(e.code) {
      case ContactError.UNKNOWN_ERROR:
        msgText = "An Unknown Error was reported while saving the contact.";
        break;
      case ContactError.INVALID_ARGUMENT_ERROR:
        msgText = "An invalid argument was used with the Contact API.";
        break;
      case ContactError.TIMEOUT_ERROR:
        msgText = "Timeout Error.";
        break;
      case ContactError.PENDING_OPERATION_ERROR:
        msgText = "Pending Operation Error.";
        break;
      case ContactError.IO_ERROR:
        msgText = "IO Error.";
        break;
      case ContactError.NOT_SUPPORTED_ERROR:
        msgText = "Not Supported Error.";
        break;
      case ContactError.PERMISSION_DENIED_ERROR:
        msgText = "Permission Denied Error.";
        break;
      default:
        msgText = "Unknown Error (" + e.code + ")";
    }
    //Now tell the user what happened
    alert(msgText, null, "Contact Search Error");
  }

//Checks that there's no missing fields
function checkContactDetails(){
	
	var error = false;
	var returnString;
	
	// cache calls to the DOM
	contactName = $('#name');
	contactStreet = $('#street1');
	contactCity = $('#city');
	contactStateCounty= $('#stateCounty');
	contactPostalCode = $('#postalCode');
	contactCountry = $('#country');
	
	if((placeHolderText ===contactName.val()) || (""==contactName.val())){
		error = true;
		$('#contactName').attr("placeholder", placeHolderText);
		$('#contactName').css('background', 'pink');
	}
	else{
		$('#contactName').css('background', 'black');
	}
	
	if((placeHolderText ===contactStreet.val()) || (""==contactStreet.val())){
		error = true;
		contactStreet.attr("placeholder", placeHolderText);
		contactStreet.css('background', 'pink');
	}else{
		contactStreet.css('background', 'black');
	}
	
	if((placeHolderText ===contactCity.val()) || (""==contactCity.val())){
		error = true;
		contactCity.attr("placeholder", placeHolderText);
		contactCity.css('background', 'pink');
	}else{
		contactCity.css('background', 'black');
	}
	
	if((placeHolderText ===contactStateCounty.val()) || (""==contactStateCounty.val())){
		error = true;
		contactStateCounty.attr("placeholder", placeHolderText);
		contactStateCounty.css('background', 'pink');
	}else{
		contactStateCounty.css('background', 'black');
	}
	
	if((placeHolderText ===contactPostalCode.val()) || (""==contactPostalCode.val())){
		error = true;
		contactPostalCode.attr("placeholder", placeHolderText);
		contactPostalCode.css('background', 'pink');
	}else{
		contactPostalCode.css('background', 'black');
	}
	
	if((placeHolderText ===contactCountry.val()) || (""==contactCountry.val())){
		error = true;
		contactCountry.attr("placeholder", placeHolderText);
		contactCountry.css('background', 'pink');
	}else{
		contactCountry.css('background', 'black');
	}
	
	
if(error){
	alert("Missing some contact details. Please enter required details.");
	 $.mobile.changePage("#contactEntryPage", "slide", false, true); 
	}else{
		returnString = "Name: " +contactName.val()+ "<br/>" +"Address: " + contactStreet.val() + "<br/>" + "City: " +contactCity.val()+ "<br/>" + "County/State: " +contactStateCounty.val()+ "<br/>" + "Post/Zip Code: " +contactPostalCode.val()+ "<br/>" +"Country: " +contactCountry.val();
		$('#checkContactDiv').html(returnString);
		$.mobile.changePage("#checkContactPage", "pop", false, true); 
	}
		
}


//displays msg to user before being posted.
function checkPostCardMsg(){
	
	// no need to check if its empty - its OK for user to not send message...
	$('#postCardMsgCheck').html(postcardMsg);
	$.mobile.changePage("#checkMsgPage", "pop", false, true); 
	
}


function postCardPost(){
	
	$.mobile.changePage($('#postingPage'), 'slide');
	
	animateDiv('#postingLoader', 10);
	
	$.ajax({
		  url: postcardEndPoint,
		  data: {	
			  	histographID : userImgDataStoreID,
			  	uniquePhoneID : uniquePhoneIDVal,
			    message : postcardMsg,
				name : contactName.val(),
				street : contactStreet.val(),
				city : contactCity.val(),
				stateCounty : contactStateCounty.val(),
				postalCode : contactPostalCode.val(),
				country : contactCountry.val()
		  }, 
		  cache: false,
		  success: function(response){
			 // alert('response: ' + response);
				if(response === 'false'){
				$.mobile.changePage("#postcardFailurePage", "slide", false, true); 
			}
			else{
				$.mobile.changePage("#postcardSuccessPage", "slide", false, true); 
			}
			},
		});
}
//TODO: this function is taking too long - call this when the postCardPaymentWarning page appears, and get it set a flag,
// if the flag is true - then the user has set an email already and if its false - then no - and redirect user...
//this will call server and check if user has added full contact details to their account
//so to assist with the Sincerely API customer service
function checkUserAccount(){

	//looks like this call was being cached - so had to go down to $.ajax (rather than $.get) to set cache:false
	$.ajax({
		  url: checkUserAccountEndPoint,
		  data: {uniquePhoneID : uniquePhoneIDVal},
		  cache: false,
		  success: function(response){
			 // alert("response: " + response);
				if(response === 'false'){
					userHasEmail = false;
				//$.mobile.changePage("#updateUserDetails", "pop", false, true); 
			}
			else{
				//$.mobile.changePage("#postcardPage", "slide", false, true); 
				userHasEmail = true;
			}
			},
		});
}

function promptUserForEmail(){
	
	if(userHasEmail)
		$.mobile.changePage("#postcardPage", "slide", false, true); 
	else
		$.mobile.changePage("#updateUserDetails", "pop", false, true);
	
}
//ref: http://www.randomsnippets.com/2008/04/01/how-to-verify-email-format-via-javascript/
function updateUserEmail(){
	
	var email = $('#email').val();
	
	var emailRegEx = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
 if (email.search(emailRegEx) == -1) {
      alert("Please enter a valid email address.");
      $.mobile.changePage("#updateUserDetails", "pop", false, true);  
 }else{
	$.get(updateUserEndPoint,
			{email: email,
			 uniquePhoneID : uniquePhoneIDVal}, 
			function(response){
				 $.mobile.changePage("#postcardPage", "slide", false, true); 
			} )
			.fail(function(response){
				alert("Problem saving email to user, will have to continue without email");
				$.mobile.changePage("#postcardPage", "slide", false, true); 
			});
 }
}

	
//loads param URL in a InAppBrowser
function loadInAppBrowser(){
	window.open(encodeURI(postingURL), '_blank', 'location=yes').addEventListener('exit', function() { $.mobile.changePage($('#shareHistoPage'), 'pop' ); });
}

//Shows user how many chars they have left in their post card msg (must be < 300)
function countChar(val) {
    var len = val.value.length;
    if (len > 300) {
    	$('#charCount').text("Over 300 character limit!")
    } else {
    	var charLeft = "Remaining Chars: ";
    	charLeft += 300 - len;
      $('#charCount').text(charLeft);
      postcardMsg = val.value;
    }
}

//Social / Post card code end
///////////////////////////


///////
// Accounts
function updateAccountDetails(){
	
	// first fire the loader:
	animateDiv('#accountLoader',10);

	//TODO: get all the html you need from the server and then inject into accounts page:
	$.get(userAccountDetailsEndPoint, {uniquePhoneID : device.uuid}, 
			function(responseText){ // callback function - appends 
			// hide the loader: 
			$('#accountLoader').hide();
			$('#accountDetails').append(responseText).html;
								
	});
	
}

//fades the div passed to it for noOfCycles times
function animateDiv(divID, noOfCycles){
	
	var fadeDiv = $(divID); // cache DOM calls
	for(var i = 0; i<noOfCycles;i++){
		
		fadeDiv.animate({opacity:'+=1'}, 1500);
		fadeDiv.animate({opacity:'-=0.6'}, 1500);
	}
	
}

//
//////////



