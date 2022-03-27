'use strict';
const bodyparser = require('body-parser');
const express = require('express');
const config = require('./config');
const FBeamer = require('./fbeamer');
var spotifyApi = require('./music/index').spotifyApi;
var scopes = require('./music/index').scopes;
const link = require('./config/development.json').lien
const matcher = require('./matcher');
const server = express();
const PORT = process.env.PORT || 3000;
const FB = new FBeamer(config.FB);



async function getMyData() {
    const me = await spotifyApi.getMe();
    return me.body

}


server.get('/login', (req, res) => {
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
});
server.get('/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code;
    const state = req.query.state;

    if (error) {
        console.error('Callback Error:', error);
        res.send(`Callback Error: ${error}`);
        return;
    }

    spotifyApi
        .authorizationCodeGrant(code)
        .then(data => {
            const access_token = data.body['access_token'];
            const refresh_token = data.body['refresh_token'];
            const expires_in = data.body['expires_in'];

            spotifyApi.setAccessToken(access_token);
            spotifyApi.setRefreshToken(refresh_token);

            console.log('access_token:', access_token);
            console.log('refresh_token:', refresh_token);

            console.log(
                `Sucessfully retreived access token. Expires in ${expires_in} s.`
            );
            res.send('Success! You can now close the window.');

            setInterval(async() => {
                const data = await spotifyApi.refreshAccessToken();
                const access_token = data.body['access_token'];

                console.log('The access token has been refreshed!');
                console.log('access_token:', access_token);
                spotifyApi.setAccessToken(access_token);
            }, expires_in / 2 * 1000);
        })
        .catch(error => {
            console.error('Error getting Tokens:', error);
            res.send(`Error getting Tokens: ${error}`);
        });
});
server.get('/', (request, response) => FB.registerHook(request, response));
server.listen(PORT, () => console.log(`FBeamer Bot Service running on Port ${PORT}`));
server.post('/', bodyparser.json({ verify: FB.verifySignature.call(FB) }));
server.post('/', async(request, response, data) => {
    return FB.incoming(request, response, data => {
        const userData = FB.messageHandler(data);
        matcher(userData.content, data => {
            console.log(data.intent)
            switch (data.intent) {

                case 'Hello':
                    {
                        console.log(spotifyApi.getAccessToken())
                        if (spotifyApi.getAccessToken() == undefined) {
                            FB.sendMessage("RESPONSE", userData.sender, `Bonjour et bienvenue ! Pour converser avec moi vous devez d'abord vous connecter à votre compte Spotify\nLien :${link}/login`);
                        } else {
                            getMyData().then((user) => {
                                console.log(user)
                                FB.sendMessage("RESPONSE", userData.sender, "Re ! Vous pouvez converser avec moi vous êtes connecté ".concat(user.display_name))
                            })
                        }
                        break;
                    }
                case 'Artist':
                    {
                        if (spotifyApi.getAccessToken() == undefined) {

                            FB.sendMessage("RESPONSE", userData.sender, `Bonjour et bienvenue ! Pour converser avec moi vous devez d'abord vous connecter à votre compte Spotify\nLien :${link}/login`);
                        } else {

                            const artist = data.entities.groups.artist
                            console.log(artist)
                            spotifyApi.searchTracks(`artist:${artist}`)
                                .then(function(data) {
                                    var num = Math.floor(Math.random() * 20) + 1;
                                    console.log('Found playlists are', data.body.tracks.items[num]);
                                    const nametrack = data.body.tracks.items[num].album.name
                                    const urltrack = data.body.tracks.items[num].album.external_urls.spotify
                                    FB.sendMessage("RESPONSE", userData.sender, `Hmmm, je pense que cette musique :  ${nametrack} de ${artist} pourrait vous plaire\nVoici le lien (cliquez pour écouter): ${urltrack}`)


                                }, function(err) {
                                    console.log('Something went wrong!', err);
                                });
                        }
                    }
                case 'Genre':
                    {
                        if (spotifyApi.getAccessToken() == undefined) {

                            FB.sendMessage("RESPONSE", userData.sender, `Bonjour et bienvenue ! Pour converser avec moi vous devez d'abord vous connecter à votre compte Spotify\nLien :${link}/login`);
                        } else {
                            const genre = data.entities.groups.genre
                            console.log(genre)
                            spotifyApi.searchPlaylists(genre)
                                .then(function(data) {
                                        var num = Math.floor(Math.random() * 20) + 1;
                                        console.log('Found playlists are', data.body.playlists.items[num]);
                                        const nameplaylist = data.body.playlists.items[num].name
                                        const urlplaylist = data.body.playlists.items[num].external_urls.spotify
                                        FB.sendMessage("RESPONSE", userData.sender, `Je vous conseille personnellement cette playlist ${nameplaylist}\nVoici le lien (cliquez pour découvrir) : ${urlplaylist}`)
                                    },
                                    function(err) {
                                        console.log('Something went wrong!', err);
                                    });
                        }
                        break;
                    }
                case 'TopArtistUser':
                    {
                        if (spotifyApi.getAccessToken() == undefined) {

                            FB.sendMessage("RESPONSE", userData.sender, `Bonjour et bienvenue ! Pour converser avec moi vous devez d'abord vous connecter à votre compte Spotify\nLien :${link}/login`);
                        }
                        else{
                            spotifyApi.getMyTopArtists()
                              .then(function(data) {
                                console.log('Found artist are', data.body);
                                console.log('Done!');

                                const nameA1 = data.body.items[0].name
                                const uriA1=data.body.items[0].external_urls.spotify
                                const nameA2 = data.body.items[1].name
                                const uriA2=data.body.items[1].external_urls.spotify
                                const nameA3 = data.body.items[2].name
                                const uriA3=data.body.items[2].external_urls.spotify
                                

                                FB.sendMessage("RESPONSE", userData.sender, `Votre top 3 Artistes est :\n1) ${nameA1} lien : ${uriA1}\n2) ${nameA2} lien : ${uriA2}\n3) ${nameA3} lien : ${uriA3}`)


                              }, function(err) {
                                console.log('Something went wrong!', err);
                              });
                        }
                        break;

                }
                case 'TopSonUser':
                    {
                        if (spotifyApi.getAccessToken() == undefined) {

                            FB.sendMessage("RESPONSE", userData.sender, `Bonjour et bienvenue ! Pour converser avec moi vous devez d'abord vous connecter à votre compte Spotify\nLien :${link}/login`);
                        }
                        else{
                            spotifyApi.getMyTopTracks()
                              .then(function(data) {
                                console.log('Found songs are', data.body);
                                console.log('Done!');

                                const nameA1 = data.body.items[0].name
                                const uriA1=data.body.items[0].external_urls.spotify
                                const nameA2 = data.body.items[1].name
                                const uriA2=data.body.items[1].external_urls.spotify
                                const nameA3 = data.body.items[2].name
                                const uriA3=data.body.items[2].external_urls.spotify
                                

                                FB.sendMessage("RESPONSE", userData.sender, `Votre top 3 musiques est :\n1) ${nameA1} lien : ${uriA1}\n2) ${nameA2} lien : ${uriA2}\n3) ${nameA3} lien : ${uriA3}`)


                              }, function(err) {
                                console.log('Something went wrong!', err);
                              });
                        }
                        break;
                    }
                case 'ArtistComme':
                    {
                        if (spotifyApi.getAccessToken() == undefined) {

                            FB.sendMessage("RESPONSE", userData.sender, `Bonjour et bienvenue ! Pour converser avec moi vous devez d'abord vous connecter à votre compte Spotify\nLien :${link}/login`);
                        }
                        else{
                            const artist = data.entities.groups.artist
                            console.log(artist)
                            spotifyApi.searchArtists(`${artist}`)
                            .then(function(data){
                                
                                console.log('artist id is', data.body.artists.items[0].id);
                                let id_artist=data.body.artists.items[0].id;

                                spotifyApi.getArtistRelatedArtists(`${id_artist}`)
                              .then(function(data) {
                                console.log('Found artist are', data.body.artists[0].name);
                                console.log('Found artist link are', data.body.artists[0].external_urls);
                                console.log('Done!');
                                
                                const ASimiName=data.body.artists[0].name;
                                const ASimiLink=data.body.artists[0].external_urls.spotify;


                                FB.sendMessage("RESPONSE", userData.sender, `Un artiste similaire à ${artist} :\n${ASimiName} lien : ${ASimiLink}`)

                                

                              }, function(err) {
                                console.log('Something went wrong!', err);
                              });

                            })
                                
                            
                        }
                        break;
                }
                case 'Exit':
                    {
                        FB.sendMessage("RESPONSE", userData.sender, "Bye");
                        break;
                    }
                default:
                    {
                        
                        FB.sendMessage("RESPONSE", userData.sender, "Veuillez réessayer je n'ai po compris !");
                    }
            }
        })



    });
});