const {app, Menu, Tray} = require('electron');
const rpc = require("discord-rpc");
const fs = require('fs');
const client = new rpc.Client({transport: "ipc"});
const request = require('request-promise');

var status = true;
var configPath = './user.txt';

client.login({clientId: "955035470021156914"}).then(async () => {
    var playNow = false;
    var timestamp;
    var timer;
    var tray;
    var user_id = fs.readFileSync(configPath, 'utf8');
    var artist;
    var track;

    async function getMusicStatus() {
        try {
            var requestData = await request(`https://api.vk.com/method/users.get?user_ids=${user_id}&fields=status&lang=0&access_token=c6cd634ac6cd634ac6cd634afcc6b6df5acc6cdc6cd634aa4fb9e4854b02709388b673c&v=5.131`);
            var user = JSON.parse(requestData)?.response[0];

            if(user.status_audio) {
                if(!!!artist || !!!track) {
                    artist = user.status_audio.artist;
                    track = user.status_audio.title;
                }

                client.setActivity({
                    details: `👤 ${user.first_name} ${user.last_name}`,
                    state: `🎶 ${artist} – ${track}`,
                    buttons: [
                        {
                            label: `🎶 VK Music`,
                            url: `https://github.com/SHUSTRIK-Milan/Discord-VK-Music-Status/blob/main/README.md`
                        },
                        {
                            label: `👤 Профиль`,
                            url: `https://vk.com/${user_id}`
                        }
                    ],
                    startTimestamp: timestamp,
                    largeImageKey: 'logo',
                    largeImageText: 'VK Music',
                    smallImageKey: 'pushpin',
                    smallImageText: 'Made by Pushpin Team',
                }).then(() => {
                    if(!playNow) {
                        timestamp = new Date().getTime();
                    }
                    playNow = true;
                });

                if(artist != user.status_audio.artist || track != user.status_audio.title) {
                    timestamp = new Date().getTime();
                }

                artist = user.status_audio.artist;
                track = user.status_audio.title;
            } else {
                throw new Error;
            }
        } catch(error) {
            playNow = false;
            client.clearActivity();
            return;
        }
    }

    function refreshStatus() {
        if(status) {
            clearTimeout(timer);
            user_id = fs.readFileSync(configPath, 'utf8');
            client.clearActivity();
            setTimeout(() => { 
                timer = setInterval(getMusicStatus, 1000)
            }, 1000);
        }
    }

    function stopStatus() {
        user_id = fs.readFileSync(configPath, 'utf8');
        if(status) {
            status = false;
            clearTimeout(timer);
            client.clearActivity();
        } else {
            status = true;
            refreshStatus();
        }
    }

    app.whenReady().then(() => {
        tray = new Tray('./resources/app/icons/logo.ico');
        //tray = new Tray('./icons/logo.ico');

        function exit() {
            app.exit();
        }

        const contextMenu = Menu.buildFromTemplate([
            {label: '🔃 Обновить', type: 'normal', click: refreshStatus},
            {label: '🔘 Вкл/Выкл', type: 'checkbox', checked: true, click: stopStatus},
            {label: '❌ Выход', type: 'normal', click: exit}
        ]);
        tray.setToolTip('VK Music');
        tray.setContextMenu(contextMenu);
    });

    timer = setInterval(getMusicStatus, 1000);
})
    .catch((error) => {
        console.log(error);
    });
