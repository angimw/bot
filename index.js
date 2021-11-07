const Discord = require("discord.js");
const { prefix, token } = require("./config.json");
const ytdl = require("ytdl-core");
const scdl = require('soundcloud-downloader').default
const { getInfo } = require('ytdl-getinfo')



const client = new Discord.Client();

const queue = new Map();

client.once("ready", () => {
  console.log("Ready!");
  client.user.setActivity("!help",{
    type: "LISTENING" 
  });
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${prefix}play`)) {
	const song = await search(message);
	if (song != -1){
		execute(message, serverQueue, song);
	}
    return;
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}pause`)) {
    pause(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}resume`)) {
    resume(message, serverQueue);
    return;	
  } else if (message.content.startsWith(`${prefix}help`)) {
    help(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}loop`)) {
    loop(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}shuffle`)) {
    shuffle(message, serverQueue);
    return;	
  } else if (message.content.startsWith(`${prefix}queue`)) {
    displayQueue(message, serverQueue);
    return;	
  } else if (message.content.startsWith(`${prefix}pray`)) {
	execute(message, serverQueue, {
	  title: 'Who is the loved one?',
	  url: 'https://www.youtube.com/watch?v=cfRBR0uOpQY'
	});
	return;
  } else if (message.content.startsWith(`${prefix}bitches`)) {
	execute(message, serverQueue, {
	  title: 'A2M-i got bitches',
	  url: 'https://www.youtube.com/watch?v=qfdFO8rWEAY'
	});
	return;
  } else if (message.content.startsWith(`${prefix}deepthroat`)) {
	execute(message, serverQueue, {
	  title: 'Deepthroat',
	  url: 'https://www.youtube.com/watch?v=e-Zcz9J1UOs'
	});
	return;
  } else {
    message.channel.send("You need to enter a valid command!");
  }
});

async function search(message){
  const args = message.content.split(" ");
  if (args.length == 1){
	message.channel.send(
      "I need a song to play\n" +
	  "Try !play <song>"
    );
	return -1;
  }
  const songInfo = await getInfo(args.slice(1).join(" "));
  if (songInfo.items.length == 0){
	message.channel.send(
	  "I didn't find the song on YouTube!"
	);
	return -1;
  }
  
  const song = {
        title: songInfo.items[0].title,
        url: songInfo.items[0].webpage_url,
   };
   return song;
}

async function execute(message, serverQueue, song) {
  const args = message.content.split(" ");
 

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "You need to be in a voice channel to play music!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I need the permissions to join and speak in your voice channel!"
    );
  }
  
  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true,
	  loop: false,
	  shuffle: false
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} has been added to the queue!`);
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  if (!serverQueue)
    return message.channel.send("There is no song that I could skip!");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
    
  if (!serverQueue)
    return message.channel.send("There is no song that I could stop!");
    
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function pause(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to pause the music!"
    );
    
  if (!serverQueue)
    return message.channel.send("There is no song that I could pause!");
    
  serverQueue.connection.dispatcher.pause();
}

function resume(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to resume the music!"
    );
    
  if (!serverQueue)
    return message.channel.send("There is no song that I could resume!");
    
  serverQueue.connection.dispatcher.resume();
}

function loop(message, serverQueue) {
    
  if (!serverQueue)
    return message.channel.send("There is no song that I could loop!");
  if (message.content.split(" ").length == 1){
	serverQueue.loop = true;
	message.channel.send("Looping now enabled");
  } else {
	  const para = message.content.split(" ")[1];
	  if (para == "break" || para == "stop"){
		  serverQueue.loop = false;
		  message.channel.send("Looping now disabled");
	  } else{
	    return message.channel.send("You need to enter a valid command!\n" +
		  "Try !loop; !loop break; !loop stop");
	  }
  }
}

function shuffle(message, serverQueue) {
    
  if (!serverQueue)
    return message.channel.send("There is no song that I could shuffle!");
  if (message.content.split(" ").length == 1){
	serverQueue.shuffle = true;
	message.channel.send("Shuffling now enabled");
  } else {
	  const para = message.content.split(" ")[1];
	  if (para == "break" || para == "stop"){
		  serverQueue.shuffle = false;
		  message.channel.send("Shuffling now disabled");
	  } else{
	    return message.channel.send("You need to enter a valid command!\n" +
		  "Try !shuffle; !shuffle break; !shuffle stop");
	  }
  }
}

function displayQueue(message, serverQueue) {
	if (!serverQueue){
		message.channel.send("There is no queue to display!");
		return;
	}
	var display = `The current queue contains the following ${serverQueue.songs.length} song(s):\n`
	for( var i =0; i < serverQueue.songs.length; i++){
		display += `\t${i+1}\t  ${serverQueue.songs[i].title}\n`;
	}
	message.channel.send(display);
}

function help(message, serverQueue) {
  return message.channel.send(
	"Currently Pray3r only supports YouTube and Soundcloud. Below is a list of all commands.\n"+
	"\t!help - to show this page\n" +
	"\t!play <song> - to play a song, url or search query\n" +
	"\t!stop - to disconnect Pray3r\n" +
	"\t!skip - to end currenct song\n"+
	"\t!queue - to show current queue\n"+
	"\t!pause - to pause\n"+
	"\t!resume - to continue\n"+
	"\t!loop - to loop current queue\n"+
	"\t!loop break/stop - to stop looping\n" +
	"\t!shuffle - to shuffle current queue\n" +
	"\t!shuffle break/stop - to stop shuffling\n" +
	"\t!pray - to play 'Who is the loved one?'\n" +
	"\t!bitches - to play 'A2M-i got bitches'\n" +
	"\t!deepthroat - to play 'cupcake deeepthroat'");
}

async function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }
  var stream1;
  if (song.url.startsWith("https://www.youtube.com/")){
    stream1 = await ytdl(song.url, {
              filter: "audioonly",
              quality: "highestaudio",
	});
  } else if (song.url.startsWith("https://soundcloud.com/")){
	stream1 = await scdl.download(song.url);
  } else{
	serverQueue.textChannel.send("I currently don't support this domain.");
	serverQueue.songs.shift();
	if (serverQueue.shuffle){
		serverQueue.songs.unshift(serverQueue.songs.splice(Math.floor((Math.random() * serverQueue.songs.length)),1)[0]);
	}
	play(guild, serverQueue.songs[0]);
	return;
  }
  const dispatcher = serverQueue.connection
	.play(stream1)
	.on("finish", () => {
	  if (serverQueue.loop){
		serverQueue.songs.push(serverQueue.songs.shift());
		} else{
		  serverQueue.songs.shift();
		}
		if (serverQueue.shuffle){
		  serverQueue.songs.unshift(serverQueue.songs.splice(Math.floor((Math.random() * serverQueue.songs.length)),1)[0]);
		}
		play(guild, serverQueue.songs[0]);
	})
	.on("error", error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
	serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}
  

client.login(token);