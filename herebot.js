// Muddy points bot by Neal Snooke 3/8/2020

//https://discord.js.org/#/docs/main/stable/class/Message
//https://discord.js.org/#/docs/main/stable/class/Client
// cd 
//intro guide
//https://discordjs.guide

//full api docs
//https://discord.js.org/#/docs/main/master/general/welcome


// I am here Discord bot by Neal Snooke 30/09/2020

//https://discord.com/api/oauth2/authorize?client_id=760978526680776754&permissions=9216&scope=bot

const emailcreds = require('./email.json');
const emailservice = 'gmail';

const prefix = '!'; //prefix for this servers commands

const Discord = require('discord.js');
const client = new Discord.Client();
const auth = require('./auth.json');

const helptext = "```I Am Here bot commands are: \n\n"
	+"!here                              Indicate that you are here!\n\n"
	+"!clear-who                         Clear all attendees (staff only)\n"
	+"                                       (registered staff AND server owner)\n\n"
	+"!who <email address>               Obtain a list of who is here\n"
	+"                                       (registered staff)\n\n"
	+"!here-privacy-policy             View the privacy policy\n\n"
	+"Problems or suggestions            email: nns@aber.ac.uk"
	+"```"

const privtext = "**IAmHere bot Privacy Policy**.\n\n"
+	"**Summary of the purpose of the bot**\n"
+	"The IAmHere bot (hereafter bot) is used to allow students to announce to university staff that they are participating in an activity on Discord\n\n"

+	"**Information the Aber Verify bot collects.**\n"
+	"The bot collects the discord ID, date and time you issued the command. "
+	"Where the user verified using AberVerify bot the Aber user ID will also be provided.\n\n"

+	"**Where the information is stored and processed**\n"
+	"The bot stores and processes the information on a University server run by the "
+	"department of Computer Science.\n\n"

+	"**Use of your information**\n"
+	"The bot uses the information collected to provide the dates and times users issued the !here command to selected members of Aberystwyth staff who run module discord servers. "

+	"The information collected will not be disclosed to any third party outside"
+	"of Aberystwyth University and will be used for the sole purpose of supporting "
+	"teaching activies"

//this is where all the muddy points data for all servers is stored
//var muddypoints = []; 

const fs = require('fs'); //read files
var nodemailer = require('nodemailer'); //email
var tools = require('./heretools');

/**
 *
 */
client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

/**
 *
 */
client.on('message', msg => {
	
	if (msg.mentions.has(client.user)) {
		if (msg.content.search("@everyone") == -1) {
			msg.channel.send(`Hi ${msg.author.username}, send me any Direct Message to find out what I do.`);
		}
	}
	
	if (msg.author.bot) return; //don't reply to my own bot messages!

	if (msg.channel.type == "dm") {
		msg.author.send(helptext);
		return;
	}
	
	// check the server can be obtained for all subsequent commands
	if (msg.guild === null){
		//console.log("Error cant DM muddy point!");
		return;
	}

	if (!msg.content.startsWith(prefix) || msg.author.bot) return;
	
	// get the command and arguments
	const args = msg.content.slice(prefix.length).trim().split(' ');
	const command = args.shift().toLowerCase();

	if (command === 'muddy-guilds'){	
		console.log(client.guilds.cache.map(x => x.name));
		msg.channel.send(client.guilds.cache.map(x => x.name)
			.catch(console.error));
		

	} else if (command === 'here'){ 

		tools.makeMuddyPoint(msg, command, client)
		.then ( muddypoint => {
			if (muddypoint == null) {return}; //no server found probably a DM
		
		msg.delete()
		.catch(console.error);
				
		msg.author.send("Thank you! Your presence is noted"
			+` in server ${msg.guild.name} !`)
		.catch(console.error);

		})
		.catch(console.error);
			
	} else if (command === 'clear-who'){
		console.log("owner"+JSON.stringify(msg.guild.ownerID, null, 2));
		console.log("user"+JSON.stringify(msg.author.id, null, 2));
		if (!tools.checkStaffSender(msg)){
			console.log("Not a staff member :");
		
			msg.author.send(`You do not have permission to clear attendance lists. University Staff should email nns to be added to the access control list.`)
				.catch(console.error);
		} else {
		
			tools.deleteAll(msg);
		}

	} else if (command === 'who'){
	
		if (!tools.checkStaffSender(msg)){
			console.log("Not a staff member :");
		
			msg.author.send(`You do not have permission to retrive attendance lists. University Staff should email nns to be added to the access control list.`)
				.catch(console.error);
		} else {
			// email - for this to work the "allow less secure app" 
			// setting must be on in gmail.
			//but running inside the uni network it should be fine on smtp host
					//https://stackoverflow.com/questions/26196467/sending-email-via-node-js-using-nodemailer-is-not-working
			//https://stackabuse.com/how-to-send-emails-with-node-js/
			//https://www.w3schools.com/nodejs/nodejs_email.asp
		
			dataset = tools.findServerPointsList(msg.guild);
			if (!dataset) {return}
			
			str= `Current attendance list for Discord server: ${msg.guild.name}\n`;
			
			dataset.attendance.forEach(member => {
				//str += member.id+" "+verdata.aberuid+"\n";
				str += member.uid
				+","+member.date
				+","+member.DCuser
				+","+member.DCtag+"\n";
	
			console.log(str);
			})
			
			
		
			//let data = JSON.stringify(dataset, null, 2);
			console.log("Send email to: "+args[0]);
		
			var transporter = nodemailer.createTransport({
				service: emailservice,
				auth: emailcreds,
			});

			var mailOptions = {
			  from: emailcreds.user,
			  to: args[0],
			  subject: 'Attendance list',
			  text: str
			};

			transporter.sendMail(mailOptions, function(error, info){
				if (error) {
					console.log(error);
					msg.channel.send('Email failed: ' + error)
						.catch(console.error);
				} else {
					console.log('Email sent: ' + info.response);
					msg.channel.send('Email sent: ' + info.response)
						.catch(console.error);
				}
			});
		}
	} else if (command === 'here-privacy-policy'){
		msg.author.send(privtext);
	}
});

client.on('guildCreate', joinedGuild => {

	//console.log("BOT JOINED NEW SERVER"+ JSON.stringify(joinedGuild, null, 2));
	console.log("BOT JOINED NEW SERVER"+ joinedGuild.name);
	
	console.log("FINISHED JOINING SERVER");
})

/**
 *
 */
client.login(auth.token);

/*
	if (command ===  'ping') {
		msg.channel.send('Pong.'
			+`\nThis server's name is: ${msg.guild.name}`
			+`\nThis channel is: ${msg.channel.name}`
			+`\nYour username: ${msg.author.username}`
			+`\nYour ID: ${msg.author.id}`);
		submissions.push(msg);
		
		// store data to file
		//https://stackabuse.com/reading-and-writing-json-files-with-node-js/
		let data = JSON.stringify(submissions, null, 2); //null,2 for formating
		fs.writeFileSync('mytest.json', data);

		msg.author.send('hello');
	} else 
*/

//TODO
//roles...
//https://discordjs.guide/popular-topics/permissions.html#roles-as-bot-permissions
//https://discordjs.guide/popular-topics/permissions.html#setting-role-permissions



