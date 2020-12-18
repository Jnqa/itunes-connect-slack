var poster = require('./post-update.js');
var dirty = require('dirty');
var db = dirty('kvstore.db');
var debug = false
var pollIntervalSeconds = process.env.POLL_TIME

var sesh = process.env.FASTLANE_SESSION
if (sesh) {
	var escapeDoubleQuotes = sesh.split('"').join('\\"')
	var replaceStartingSingleQuotes = JSON.parse('"' + escapeDoubleQuotes + '"')
	process.env.FASTLANE_SESSION = replaceStartingSingleQuotes
}

function checkAppStatus() {
	console.log("Fetching latest app status...")

	// invoke ruby script to grab latest app status
	var exec = require("child_process").exec;
	exec('ruby get-app-status.rb', function (err, stdout, stderr) {
		if (stdout) {
			// compare new app info with last one (from database)
			console.log(stdout)
			let versions;
			try {
				versions = JSON.parse(stdout);
			} catch (e) { }
			if (!versions) {
				const array = stdout.split("\n").map(x => x.trim());
				for (let item of array) {
					try {
						versions = JSON.parse(item);
					} catch (e) {

					}
				}
			}
			if (!versions)
				return console.error(stdout);

			for (let version of versions) {
				_checkAppStatus(version);
			}
		}
		else {
			console.log("There was a problem fetching the status of the app!");
			console.log(stderr);
		}
	});
}

function _checkAppStatus(version) {
	// use the live version if edit version is unavailable
	var currentAppInfo = version["editVersion"] ? version["editVersion"] : version["liveVersion"];
	
	currentAppInfo.status = humanizeStatus(currentAppInfo.status)
	if (!currentAppInfo.iconUrl)
	{
		if (version["editVersion"] && version["editVersion"].iconUrl)
			currentAppInfo.iconUrl = version["editVersion"].iconUrl
		else if (version["liveVersion"] && version["liveVersion"].iconUrl)
			currentAppInfo.iconUrl = version["liveVersion"].iconUrl
	}
	// console.log(`\n\n\n${currentAppInfo.name} icon url: ` + JSON.stringify(currentAppInfo.iconUrl) + "\n\n\n")
	// return
	if (currentAppInfo.iconUrl)
		currentAppInfo.iconUrl = fillTemplate(currentAppInfo.iconUrl.templateUrl)

	var appInfoKey = 'appInfo-' + currentAppInfo.appId;
	var submissionStartkey = 'submissionStart' + currentAppInfo.appId;

	var lastAppInfo = db.get(appInfoKey);
	if (!lastAppInfo || lastAppInfo.status != currentAppInfo.status || debug) {
		poster.slack(currentAppInfo, db.get(submissionStartkey));

		// store submission start time`
		if (currentAppInfo.status == "Waiting For Review") {
			db.set(submissionStartkey, new Date());
		}
	}
	else if (currentAppInfo) {
		console.log(`Current status \"${currentAppInfo.status}\" matches previous status. AppName: \"${currentAppInfo.name}\"`);
	}
	else {
		console.log("Could not fetch app status");
	}

	// store latest app info in database
	db.set(appInfoKey, currentAppInfo);
}

function fillTemplate(iconUrl) {
	return iconUrl.replace('{w}', '90').replace('{h}', '90').replace('{f}', 'png')
}

function humanizeStatus(status) {
	var statuses = {
		PREPARE_FOR_SUBMISSION: "Prepare for Submission",
		READY_FOR_SALE: "Ready for Sale",
		REJECTED: "Rejected",
		WAITING_FOR_REVIEW: "Waiting For Review",
		IN_REVIEW: "In Review",
		PENDING_CONTRACT: "Pending Contract",
		WAITING_FOR_EXPORT_COMPLIANCE: "Waiting For Export Compliance",
		PENDING_DEVELOPER_RELEASE: "Pending Developer Release",
		PROCESSING_FOR_APP_STORE: "Processing for App Store",
		PENDING_APPLE_RELEASE: "Pending Apple Release",
		METADATA_REJECTED: "Metadata Rejected",
		REMOVED_FROM_SALE: "Removed From Sale",
		DEVELOPER_REJECTED: "Developer Rejected",
		DEVELOPER_REMOVED_FROM_SALE: "Developer Removed From Sale",
		INVALID_BINARY: "Invalid Binary",
	}
	return statuses[status]
}

if (!pollIntervalSeconds) {
	pollIntervalSeconds = 60 * 2;
}

setInterval(checkAppStatus, pollIntervalSeconds * 1000);
checkAppStatus();
