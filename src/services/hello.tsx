const HELLO_PHRASES = [
  "Hello there!", // Star Wars (Obi-Wan)
  "Well met!", // Hearthstone
  "General Kenobi.", // Meme reply to “Hello there!”
  "Stay a while and listen.", // Diablo (Deckard Cain)
  "Greetings, traveler.", // Hearthstone Innkeeper
  "Hello, World!", // Programming tradition
  "Live long and prosper.", // Star Trek
  "Good morning, Vietnam!", // Film
  "Hi-ho, Kermit the Frog here!", // The Muppets
  "Hey, you. You're finally awake.", // Skyrim
  "Good news, everyone!", // Futurama (Prof. Farnsworth)
  "It's-a me, Mario!", // Super Mario
  "Hello, and again, welcome to the Aperture Science computer-aided enrichment center.", // Portal (GLaDOS)
  "Hey! Listen!", // The Legend of Zelda (Navi)
  "Hi everybody!", // The Simpsons (Dr. Nick)
  "Greetings and salutations.", // Heathers
  "Hello, friend.", // Mr. Robot
  "Salutations.",
  "Howdy, partner!",
  "Welcome. Welcome to City 17.", // Half-Life 2 (Dr. Breen)
  "Greetings, programs!", // TRON
  "Shall we play a game?", // WarGames
  "Hi, I'm Troy McClure. You may remember me from…", // The Simpsons
  "Good evening, ladies and gentlemen.", // The Dark Knight (Joker)
];

export function getHello(): string {
  const i = Math.floor(Math.random() * HELLO_PHRASES.length);
  return HELLO_PHRASES[i];
}
