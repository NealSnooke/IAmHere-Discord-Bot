const fs = require('fs'); //read files

var moderatorRole;
var botuser;

const paths = require('./paths.json');

//const verifydatapath = `aber_verify`;
//const StaffListFile = `aber_verify/staff.json`;

/**
 * read the muddy points submissions from file
 */
function findServerPointsList(server){
	let filename = `attendance/s${server.id}.json`;
	//console.log("Looking for filename: "+filename);
	
	if (fs.existsSync(filename)){
		let rawdatamuddy = fs.readFileSync(filename);
		//console.log("raw data: "+rawdatamuddy);
		
		muddypoints = JSON.parse(rawdatamuddy);
		//console.log("parsed data: "+JSON.stringify(muddypoints, null, 2));
		//console.log(muddypoints.points.length+" stored server points sets loaded");
		return muddypoints;
		
	} else {
	
		//console.log("no muddy_points.json file found");
		console.log("Adding new server: "+server.id);
		var pointsArray = [];
		newserver = {
			server: server.id, 
			attendance: pointsArray,
		};
		
		//muddypoints[`server-${server.id}`] = pointsArray;
		//console.log(muddypoints);
		return newserver;
	}
}

/**
 * create the text of the muddy message
 */
function muddyText(muddypoint, pointnumber, msg){
	let name = "";
	if (muddypoint.visability == "attributed") {
		name = `  ${muddypoint.poster} asked:`
	}
	
	return "**MUDDY POINT "+pointnumber
		+"**: "+name + "\n"
		+ muddypoint.content+` \n`
		+ muddypoint.answer;
}
 
/**
 * store the muddy point info
 */
function addMuddyPoint(muddypoint, server, muddypoints){
	//following line works but problems then non integer index doesn' stringyify
	//muddypoints[`server-${msg.guild.id}`].push(muddypoint); 
	
	//store the relevant muddy point info
	muddypoints.attendance.push(muddypoint);
	
	//console.log(muddypoints);
	return muddypoints.attendance.length;
}

/**
 * save to file for this server
 */
function storeMuddyPoint(muddypoints){
	// store data to file
	// https://stackabuse.com/reading-and-writing-json-files-with-node-js/
	
	let filename = `attendance/s${muddypoints.server}.json`;
	//console.log("Store filename: "+filename);
	
	let data = JSON.stringify(muddypoints, null, 2); //null, 2 for formating
	fs.writeFileSync(filename, data);
	
	//console.log("Stored DATA: "+data);
}

/**
 * create a muddy point and post it
 * msg is a Discord.js message 
 * command it the command that sent the message (so it can be removed!)
 * muddyChannel the Discord.js  muddy-points channel on this server 
 */
async function makeMuddyPoint(msg, command, client){
	var server = msg.guild; // null if DM
	
	let muddypoints = findServerPointsList(server);
	
	console.log("Now log here...");
	var date = new Date();
	
	//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString
	
	const options = { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
	
	//console.log(event.toLocaleDateString('uk-UK', options));
	
	var d = date.toLocaleDateString('en-GB', {year: 'numeric', month: '2-digit', day: '2-digit'});
	
	var t = date.toLocaleTimeString('en-GB', {hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'});
	
	//var str = date.toLocaleString('en-GB', options);
	//var str = date.toLocaleTimeString('en-GB', options);
	
	var str = d+","+t;
	
	var str1 = date.toISOString();
	
	var str = str1.substring(0, 10)+" "+str1.substring(11, 19)
	//console.log(str);
	
	//var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() 
	//	+ ", " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
	
	let verdata = retrieveVerificationInfo(msg.author.id);

	let uid = "unverified user";
    if (verdata){
    	uid = verdata.aberuid;
    }
    
    let tdn = msg.member.displayName; //force string copy
    //let dn =  tdn.replace(/"/g, "\\\"");
    let dn =  tdn.replace(/"/g, "\"\"");
    //console.log("zzz "+dn);
    
    let tut = msg.member.user.tag; //force string copy
    //let ut =  tut.replace(/"/g, "\\\"");
    let ut =  tut.replace(/"/g, "\"\"");
    //console.log("zzz "+ut);
    
	//create the muddy point info
	var muddypoint = { 
		uid: `\"${uid}\"`,
		//DCuser: `${msg.author.username}`,
		//DCuser: `${msg.member.nickname}`,
		DCuser: `\"${dn}\"`,
		DCtag: `\"${ut}\"`,
		DCid: `${msg.member}`,
		date: `${str}`,
	};
	
	len = addMuddyPoint(muddypoint, server, muddypoints);
	
	storeMuddyPoint(muddypoints);
	
	return muddypoint;
};

/**
 * read the verified user data from a file if it exists
 * dcuid is discord userid
 *
 * returns null if not found (never tried to verify)
 */
function retrieveVerificationInfo(dcuid){
	let filename = `${paths.verifydatapath}/s${dcuid}.json`;
	console.log("Looking for filename: "+filename);
	
	if (fs.existsSync(filename)){
		let rawdataverify= fs.readFileSync(filename);
		//console.log("raw data: "+rawdatamuddy);
		
		verifydata = JSON.parse(rawdataverify);
		//console.log("parsed data: "+JSON.stringify(muddypoints, null, 2));
		//console.log(muddypoints.points.length+" stored server points sets loaded");
		return verifydata;
		
	}
	
	return null;
}

/*
 * check if the user is listed as an Aber staff member
 */
function checkStaffSender(msg){
	var reqdname = '';
	var item = null;
	
	function findStaff(r) {
		//console.log("findStaff "+reqdname);
		return r == reqdname;
	}
	
	//let role = joinedGuild.roles.cache.find(findModerateRole);
	//console.log("unverify");
	
	let memberid = msg.member.id;
	console.log("unverify member "+memberid);
	
	let guild = msg.guild;
	
	// fetch the verification data to get the aber uid info
	let verdata = retrieveVerificationInfo(memberid);
	
	if (verdata){
		console.log("unverify message from "+verdata.aberuid)//+" for "+memberid);
		
		//is the message from a verified staff member
		staff = findStaffList(paths.StaffListFile);
		console.log(JSON.stringify(staff, null, 2));
		
		reqdname = verdata.aberuid;
		console.log("Looking for staff: "+reqdname);
		
		item = staff.aberuid.find(findStaff);
		
		console.log("Found: "+item);
		return item
		
	} else {
		//console.log("Not a verified member :"+reqdname);
		return null
	}
}

/*
 * load the staff list file
 */
function findStaffList(ListFile){
	
	//console.log("Looking for filename: "+filename);
	
	if (fs.existsSync(ListFile)){
		console.log("found staff file");
		
		let rawdata = fs.readFileSync(ListFile);
		//console.log("raw data: "+rawdatamuddy);
		
		stafflist = JSON.parse(rawdata);
		//console.log("parsed data: "+JSON.stringify(muddypoints, null, 2));
		//console.log(muddypoints.points.length+" stored server points sets loaded");
		return stafflist;
		
	} else {
		console.log("no staff file found");
		var pointsArray = [];
		stafflist = {
			aberuid: pointsArray,
		};
		
		let data = JSON.stringify(stafflist, null, 2); //null, 2 for formating
		
		fs.writeFileSync(paths.StaffListFile, data);
		
		return stafflist;
	}
}

/**
 * 
 */
function deleteAll(msg){
	var server = msg.guild; // null if DM
	
	if (msg.author.id != msg.guild.ownerID){
		msg.author.send("Sorry - Only server owner allowed to do that!");
		return
	}
	
	msg.author.send("Attendance List for server "
			+`in ${msg.guild.name} cleared` );
			
	console.log("Clearing attendance list: "+server.id);
	pointsList = findServerPointsList(msg.guild);
	
	var date = new Date();
	var str1 = date.toISOString();
	let filename = `attendance/b${muddypoints.server}_${str1}.json`;
	console.log("Backup filename: "+filename);
	
	let data = JSON.stringify(pointsList, null, 2); //null, 2 for formating
	fs.writeFileSync(filename, data);
	
	pointsList.attendance = [];
	storeMuddyPoint(pointsList);
}

/**
 * the externally visable functions
 */
module.exports = {
	makeMuddyPoint : makeMuddyPoint,
	findServerPointsList : findServerPointsList,
	storeMuddyPoint : storeMuddyPoint,
	deleteAll : deleteAll,
	checkStaffSender : checkStaffSender
	//print: function (){console.log("hello")}

}; //end module.exports
