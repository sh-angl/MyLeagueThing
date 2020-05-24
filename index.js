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
 
// smaple code i wi;ll use later as an example on hoq to do it myself

// having some problems with connection.connect() and connection.end()


// connection.connect();
 
// connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
//   if (error) throw error;
//   console.log('The solution is: ', results[0].solution);
// });
 
// connection.end();


connection.query('DROP TABLE IF EXISTS related', (error) => {
    if (error) throw error; 
});
 
connection.query(`CREATE TABLE related(
    leagueID VARCHAR(60),
    discordSnowflake VARCHAR(20),
    PRIMARY KEY(leagueID)
)`, (error) => {
  if (error) throw error;
});
 


// start hte bot part

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
    let input = msg.content.split(" ")
    let command = input.shift()
    if (command === 'ping') {
        msg.reply('Pong!');


    }else if (command === '!move'){
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


    }else if (command === "!league"){
        console.log(LOLPlayer)
        const accountStuff = await kayn.Summoner.by.name(LOLPlayer)
        console.log(accountStuff)
        // ^ default region is used, which is `na` unless specified in config
        kayn.CurrentGame.by.summonerID(accountStuff.id).then(thing => {
            console.log(thing)
            for (let summoner of thing.participants){
                console.log(summoner.summonerName, summoner.teamId)
            }
            })
            .catch( err => console.log(err))


    }else if  (command === "!register"){
        // important to note that whats in use is id and not accountid. id is returned by the spectator api so this is what i use. also id is region specific and therefore someone cna have the same id in a different region
        const leagueName = input[0]
        const summObj = await kayn.Summoner.by.name(leagueName)
        const leagueID = summObj.id
        console.log(`${leagueName} has leagueID of ${leagueID}`)

        // sql entry into db
        connection.query('INSERT INTO related VALUES ( ? , ? )', [leagueID, msg.author.id],
            (error) => {
                if (error){
                    if (error.code = "ER_DUP_ENTRY"){
                        msg.member.send(`\`${leagueName}\` is already associated with a discord account`)
                    }else{
                        console.log(error)
                    }
                }else{
                    msg.member.send(`You have registered \`${leagueName}\` with your account.`)
                }
            }
        )


    }else if(command === "!deregsiter"){
        const leagueName = input[0]
        const summObj = await kayn.Summoner.by.name(leagueName)
        const leagueID = summObj.id
        connection.query(`SELECT discordSnowflake FROM related
            WHERE leagueID = ?`,
            [leagueID],
            (error, results, fields) => {
                if (error){
                    console.log(error)
                }else{
                    if(results.discordSnowflake === msg.author.id){

                    }else{
                        
                    }
                }
            })
       

    }else if(command === "!voice"){
        console.log(msg.member.voice)
    }
  });


client.login(discordToken);