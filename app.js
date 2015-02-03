#!/usr/bin/env node
var color = require("colors");
var GS = require("grooveshark-streaming");
var _ = require("underscore");


var fs = require("fs");
var http = require("http");
var mplayer = require("child_process").spawn;
var readline = require("readline").createInterface({input : process.stdin, output : process.stdout});

var args = [];

for (i=0; i<process.argv.join(" ").split(" -").length; i++) {
	if (i!=0) args[i-1] = process.argv.join(" ").split(" -")[i]
};

if (args.length == 0) help();

if (!fs.existsSync("/home/" + process.env["USER"] + "/Music")) {
	fs.mkdirSync("/home/" + process.env["USER"] + "/Music", 0775);
}
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
	process.stdout.write("gplayer v1.0.9, by: Bram \"#96AA48\" van der Veen\n\n");
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
	 for (i=0; i<fs.readdirSync("/home/" + process.env["USER"] + "/Music").length; i++) {
	 	files[i] = fs.readdirSync("/home/" + process.env["USER"] + "/Music")[i];
	};

	for (i=0; i<files.length; i++) {
		process.stdout.write("[".cyan + i + "] ".cyan + (files[i].split(".mp3")[0]).bold + "\n");
		if (i==files.length - 1) process.stdout.write("\n");
	};

	readline.question("What song do you want to play? #", function (input) {
		if (parseInt(input) != NaN) play(files[input]);
	});
}

function lookup(query) {
	http.get(link(query), function (res) {
		var b = ""; res.on("data", function (data) {b+=data});
		res.on("end", function () {
			b = JSON.parse(b);for (i = 0; i < b.length; i++) {process.stdout.write("[".cyan + i + "] ".cyan + (b[i].SongName + " - " + b[i].ArtistName).bold + "\n"); if (i==b.length-1) process.stdout.write("\n");}
			readline.question("What song do you want to play? #", function (input) {if (parseInt(input) != NaN) {
				GS.Grooveshark.getStreamingUrl(b[input].SongID, function (err, streamUrl) {
					var filename = "/home/" + process.env["USER"] + "/Music/" + b[input].SongName + " - " + b[input].ArtistName + ".mp3";
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
								play(filename.split("/")[filename.split("/").length - 1])
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
	var player = mplayer("mplayer", ["-ao","alsa", "/home/" + process.env["USER"] + "/Music/" + file]);
	var isfiltered = false;

	player.stdout.on("data", function (data) {
		if (data.toString().substr(0,2) == "A:" && !isfiltered) { 
			player.stdout.pipe(process.stdout);
	 		isfiltered = true;
		}
	});

	process.stdin.pipe(player.stdin);

	player.on("error", function (data) {process.stdout.write("There was an error playing your song, maybe you need to install mplayer?\n");
		process.exit(0);
	});
}

function link(query) {return "http://tinysong.com/s/" + query + "?format=json&limit=20&key=0131065fac026c65c87e3658dfa66b88";};