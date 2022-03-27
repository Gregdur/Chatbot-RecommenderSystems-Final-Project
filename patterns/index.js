const patternDict = [{
  pattern: '\\b(?<greeting>Hi|Hello|Hey|Salut|Bonjour)\\b',
  intent: 'Hello'
},
{
  pattern: '\\b(Bye|Exit|Kill)\\b',
  intent: 'Exit'

}, {
  pattern: 'montre\\smoi\\smes\\sartistes\\spréférés\\b',
  intent: 'TopArtistUser'
},{
  pattern: 'montre\\smoi\\smes\\ssons\\spréférés\\b',
  intent: 'TopSonUser'
},
{
  pattern: 'playlist de \\b(?<genre>[a-z]+[ a-z])',
  intent: 'Genre'
}, {
  pattern: 'musique de \\b(?<artist>[a-z]+[ a-z])\\b',
  intent: 'Artist'
},{
  pattern: 'artiste comme \\b(?<artist>[a-z]+[ a-z])\\b',
  intent: 'ArtistComme'
}


];

module.exports = patternDict;