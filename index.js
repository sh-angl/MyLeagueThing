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
var pool = mysql.createPool({
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


pool.query('DROP TABLE IF EXISTS related', (error) => {
    if (error) throw error; 
});
 
pool.query(`CREATE TABLE related(
    leagueID VARCHAR(60),
    discordSnowflake VARCHAR(20),
    PRIMARY KEY(leagueID)
)`, (error) => {
  if (error) throw error;
});

pool.query('DROP TABLE IF EXISTS reports', error => {
    if (error) throw error;
})

pool.query(`CREATE TABLE reports(
    discordSnowflake VARCHAR(20),
    reported INT,
    times INT
    PRIMARY KEY(discordSnowflake)
)`)


 


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

    }else if  (command === "!register"){
        // important to note that whats in use is id and not accountid. id is returned by the spectator api so this is what i use. also id is region specific and therefore someone cna have the same id in a different region
        const leagueName = input[0]
        const summObj = await kayn.Summoner.by.name(leagueName)
        const leagueID = summObj.id
        console.log(`${leagueName} has leagueID of ${leagueID}`)

        // sql entry into db
        pool.query(`INSERT INTO related VALUES ( ? , ? );
                    INSERT INTO reports VALUES ( ?, ?, ?)`, [leagueID, msg.author.id, msg.author.id, 0, 0],
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


    }else if(command === "!deregister"){
        const leagueName = input[0]
        const summObj = await kayn.Summoner.by.name(leagueName)
        const leagueID = summObj.id
        pool.query(`SELECT discordSnowflake FROM related
            WHERE leagueID = ?`,
            [leagueID],
            (error, results, fields) => {
                console.log(results.length)
                if (error){
                    console.log(error)
                }else if (results.length != 0){
                    console.log(results[0].discordSnowflake)
                    if(results[0].discordSnowflake === msg.author.id){
                        pool.query(`DELETE FROM related
                        WHERE leagueID = ?`, [leagueID], (error) => {
                            if (error){
                                console.log(error)
                            }else{
                                msg.member.send(`\`${leagueName}\` has been deregistered from this discord account`)
                            }
                        })
                    }else{
                        msg.member.send(`You cannot register \`${leagueName}\` from their discord account`)
                    }
                }
            })
       

    }else if(command === "!voice"){
        console.log(msg.member.voice)


    }else if (command === "!match"){
        if(msg.member.voice.sessionID === undefined){
            msg.member.send('You must first join a lobby voice channel before using this command')
            return
        }
        pool.query(`SELECT leagueID FROM related WHERE discordSnowflake = ?`, msg.member.id, (error, results, fields) => {
            if (results[0] === undefined){
                msg.member.send('You must first register your League of Legends username to your discord account')
                return
            }

            kayn.CurrentGame.by.summonerID(results[0].leagueID).then(matchData => {
                // first step is check in case the vc has already been created
                for (let vc of msg.guild.channels){
                    if (vc[1].name === matchData.gameId){
                        msg.member.voice.setChannel(vc[0])
                        return
                    }
                }


                // this occurs if a vc for the game hasnt been created
                console.log(matchData)
                let msgersLeagueID = results[0].leagueID
                let teamLeagueIDList= []
                let teamID;
                for (let player of matchData.participants){
                    if (player.summonerId === msgersLeagueID){
                        teamID = player.teamId
                        break
                    }
                }
                for (let player of matchData.participants){
                    if(player.teamId === teamID && player.summonerId != msgersLeagueID){
                        teamLeagueIDList.push(player.summonerId)
                    }
                }
                pool.query(`SELECT discordSnowflake FROM related WHERE leaugeID="` + teamLeagueIDList.join(`" OR leagueID="`) + `"`, (error, results, fields) => {
                    if (error){
                        console.log(error)
                        return
                    }
                    console.log(results, fields)
                    if (results.length === 0) {
                        msg.member.send('Noone else from your game is registered with this service')
                        return
                    }

                    msg.guild.channels.create(matchData.gameId,{
                        type: 'voice'
                    }).then(voiceChannel => {
                        let reformattedResults = []
                        for (let discordSnowflakeContainer of results){
                            reformattedResults.push(discordSnowflakeContainer.discordSnowflake)
                        }
                        let otherMembers = msg.guild.members.fetch(reformattedResults).then( (first, second) => {
                            console.log(otherMembers)
                            for (let member of first){
                                if(member.voice.sessionID){
                                    member.voice.setChannel(voiceChannel)
                                }
                            }
                            msg.member.voice.setChannel(voiceChannel)
                            pool.query(`UPDATE reports SET times = times + 1 WHERE discordSnowflake = "` + msg.member.id + `" OR discordSnowflake = "` + reformattedResults.join(`" OR discordSnowflake = "`) + `"`,
                        (error) => {
                            if (error){
                                console.log(error)
                            }
                        })

                        })
                    })
                })
            }).catch(thing => {
                if (JSON.parse(thing.error.response.body).status.message === "Data not found"){
                    msg.member.send('It does not appear you are in a game at the moment')
                }else{
                    console.log(thing)
                }
            })
        })
    }else if(command === "!cache"){
        for(let channel of msg.guild.channels.cache){
            console.log(channel[1].name)
        }
    }
  });


client.login(discordToken);