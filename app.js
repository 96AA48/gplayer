#!/usr/bin/env node
var color = require("colors");
var GS = require("grooveshark-streaming");
var _ = require("underscore");
var lame = require('lame');

var fs = require("fs");
var http = require("http");
var readline = require("readline").createInterface({input : process.stdin, output : process.stdout});
var vol = 1;

var args = [];

for (i=0; i<process.argv.join(" ").split(" -").length; i++) {
	if (i!=0) args[i-1] = process.argv.join(" ").split(" -")[i]
};

if (args.length == 0) help();

_.each(args, function (item) {
	if (item == "-help" || item == "h") { 
		help();
	}
	else if (item == "o" || item == "-offline") {
		return offline();
	 	process.exit(0);
	}
	else {
		return lookup(item.substr(2,item.length));
	 	process.exit(0);
	}
});


function help() {
	process.stdout.write("gplayer v1.1.0, by: Bram \"#96AA48\" 	van der Veen\n\n");
	process.stdout.write("Usage : gplayer [options] <-s song>\n");

	var options = [
		["-s <song>, --song <song>", "Song to listen to"],
		["[-o], [--offline]", "\tOffline mode/listen to cached songs"],
		["[-h], [--help]", "\t\tDisplay helpful information (this stuff)"]
	];

	for (i=0; i<options.length;	i++) {
		process.stdout.write("\t" + options[i][0] + "\t" + options[i][1] + "\n");
	};

	process.exit(0);
}

function offline() {
	var files = [];
	 for (i = 0; i< fs.readdirSync(getDownloadFolder()).length; i++) {
	 	files[i] = fs.readdirSync(getDownloadFolder())[i];
	};

	for (i=0; i<files.length; i++) {
		process.stdout.write("[".cyan + i + "] ".cyan + (files[i].split(".mp3")[0]).bold + "\n");
		if (i==files.length - 1) process.stdout.write("\n");
	};

	readline.question("What song do you want to play? #", function (input) {
		if (parseInt(input) != NaN) play(getDownloadFolder() + files[input]);
	});
}

function lookup(query) {
	http.get(link(query), function (res) {
		var _body = ""; 
		res.on("data", function (data) {
			_body+=data
		});

		res.on("end", function () {
			_body = JSON.parse(_body);

			for (i = 0; i < _body.length; i++) {
				process.stdout.write("[".cyan + i + "] ".cyan + (_body[i].SongName + " - " + _body[i].ArtistName).bold + "\n"); 
				if (i==_body.length - 1) process.stdout.write("\n");
			}

			readline.question("What song do you want to play? #", function (input) {if (parseInt(input) != NaN) {
				GS.Grooveshark.getStreamingUrl(_body[input].SongID, function (err, streamUrl) {
					var filename = getDownloadFolder() + _body[input].SongName + " - " + _body[input].ArtistName + ".mp3";
					if (!fs.existsSync(filename)) {
						http.get(streamUrl, function(res) {
							res.on("data", function (data){
								if (fs.existsSync(filename)) {
									fs.appendFileSync(filename, data);
								}
								else {
									fs.writeFileSync(filename, data);
								}
							});
							res.on("end", function () {
								play(filename)
							});
						});
					}
					else {
						play(filename);
					}
				});
			}});
		});
	});
}

function play(file) {
	process.stdout.write(file.split('/')[file.split('/').length - 1].split('.')[0]+ '\n');
	
	var decoder = new lame.Decoder();
	var speaker = new require('speaker')();

	fs.createReadStream(file).pipe(decoder).pipe(speaker);


	
}

function link(query) {return "http://tinysong.com/s/" + query + "?format=json&limit=20&key=0131065fac026c65c87e3658dfa66b88";};

function getDownloadFolder() {
	if (process.platform == "win32") var folder = "C:\\Users\\" + process.env.USERNAME + "\\gplayer\\";
	else if (process.platform == "linux") var folder = "/home/" + process.env.USER + '/gplayer/';
	if (!fs.existsSync(folder)) fs.mkdirSync(folder);
	return folder;
}

function getConfig() {
	if (process.platform == "win32") var config = "C:\\Users\\" + process.env.USERNAME + "\\gplayer\\.config";
	else if (process.platform == "linux") var config = "/home/" + process.env.USER + '/gplayer/.config';
	// if (!fs.existsSync(config)) fs.
}