// this is for discord stuff
const Discord = require('discord.js');
const client = new Discord.Client();

// this is for league stuff
const _kayn = require('kayn')
const Kayn = _kayn.Kayn
const REGIONS = _kayn.REGIONS
const kayn = Kayn("RGAPI-8bb3f23e-d62f-4d24-959a-fcc08652dc2d")({
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

// maybe better stuff than earlier
// sample code to do sonething
const main = async () => {
    const accountStuff = await kayn.Summoner.by.name('1shanghai')
    console.log(accountStuff)
    // ^ default region is used, which is `na` unless specified in config
    const result = await kayn.CurrentGame.by
        .summonerId(accountStuff.id)
    console.log(result)
}


// this was for some random thing for testing
const otherChannelID = "711029454666858497";

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
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
      main()
    }
  });

client.login('Njg0MDE4NDc5NjU3MjU0OTEz.Xr9DOw.h2nDwq09ohEi9yKSenrxOOMmMeM');