// ref: for cordova 2.x: https://github.com/jacob/ClipboardManagerPlugin/tree/master/v2.0.0

/**
 * Phonegap ClipboardManager plugin
 * Omer Saatcioglu 2011
 * Guillaume Charhon - Smart Mobile Software 2011
 * Jacob Robbins - Phonegap 2.0 port 2013
 */


window.clipboardManagerCopy = function(str, success, fail) {
	cordova.exec(success, fail, "ClipboardManagerPlugin", "copy", [str]);
};

window.clipboardManagerPaste = function(success, fail) {
	cordova.exec(success, fail, "ClipboardManagerPlugin", "copy", []);
};

