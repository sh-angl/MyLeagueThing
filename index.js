const Discord = require('discord.js');
const client = new Discord.Client();

const otherChannelID = "711029454666858497";

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('Pong!');
  }
    if (msg.content === '!move'){
        msg.guild.channels.create('new-voice', {
            type: 'voice'
        }).then(voiceChannel => {
            msg.member.voice.setChannel(voiceChannel)
        })
        // var yass = msg.member
        // yass.voice.setChannel(otherChannelID)
    }
});

client.login('Njg0MDE4NDc5NjU3MjU0OTEz.Xr9DOw.h2nDwq09ohEi9yKSenrxOOMmMeM');