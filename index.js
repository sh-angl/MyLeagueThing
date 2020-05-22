// first thing is to get my config.json file up and ready
const {discordToken, riotAPIToken, sqlDBStuff, LOLPlayer} = require('./config.json')



// this is for discord stuff
const Discord = require('discord.js');
const client = new Discord.Client();

// this is for league stuff
const _kayn = require('kayn')
const Kayn = _kayn.Kayn
const REGIONS = _kayn.REGIONS
const kayn = Kayn(riotAPIToken)({
  region: REGIONS.EUROPE_WEST,
  apiURLPrefix: 'https://%s.api.riotgames.com',
  locale: 'en_US',
  debugOptions: {
      isEnabled: true,
      showKey: false,
  },

  requestOptions: {
      shouldRetry: true,
      numberOfRetriesBeforeAbort: 3,
      delayBeforeRetry: 1000,
      burst: false,
      shouldExitOn403: false,
  },

  cacheOptions: {
      cache: null,
      timeToLives: {
          useDefault: false,
          byGroup: {},
          byMethod: {},
      },
  },
})

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : sqlDBStuff.host,
  user     : sqlDBStuff.user,
  password : sqlDBStuff.password,
  database : sqlDBStuff.database
});
 
connection.connect();
 
connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0].solution);
});
 
connection.end();


// start hte bot part

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
    if (msg.content === 'ping') {
      msg.reply('Pong!');
    }
    if (msg.content === '!move'){
        let memberList = []
        memberList.push(msg.member)


        msg.guild.channels.create('new-voice', {
            type: 'voice'
        }).then(voiceChannel => {
            // console.log('yass')
            for (let member of memberList){
                member.voice.setChannel(voiceChannel)
            }
        })
        // var yass = msg.member
        // yass.voice.setChannel(otherChannelID)
    }
    if (msg.content === "!league"){
        console.log(LOLPlayer)
        const accountStuff = await kayn.Summoner.by.name(LOLPlayer)
        console.log(accountStuff)
        // ^ default region is used, which is `na` unless specified in config
        kayn.CurrentGame.by.summonerID(accountStuff.id).then(thing => {
            for (let summoner of thing.participants){
                console.log(summoner.summonerName, summoner.teamId)
            }
            })
            .catch( err => console.log(err))
    }
  });

client.login(discordToken);