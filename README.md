# NANA Online Board Game [中文](https://github.com/Cyronlee/nana-card-game/blob/master/README-zh.md)

An online multiplayer card game.

![](https://github.com/Cyronlee/nana-card-game/blob/master/public/img/example.png?raw=true)

Play by visiting [https://nana.cyron.site](https://nana.cyron.site) with your browser.

It supports creating rooms and joining others' rooms.

This website is hosted on `Vercel`, made with `NextJS` and `Framer motion`, and uses `Vercel KV (Redis)` to store server
states.

The entire architecture is completely free.

⚠️Existing Issues: The free version of Vercel KV has a limit of 10,000 calls per day, which is only sufficient for 6
people to play for 30 minutes. Errors may occur in the game due to this limitation; you can try deploying this project
yourself and share it with your friends; I am also exploring other solutions to address this problem.

## Development Roadmap

You are welcome to join in developing more features, and submitting issues to help improve the project.

- [x] Multiplayer online play
- [x] Sound effects
- [ ] Internationalization
- [ ] Adaptation for small screens
- [ ] Seat layout optimization for different number of players
- [ ] Scoreboard
- [ ] Progressive Web App (PWA) mode
- [ ] Share players' mouse using WebRTC
- [ ] Find a free Redis server
- [ ] Find a free WebSocket server
- [ ] More attractive animations
- [ ] More appealing UI

## Local Development

```bash
npm install

npm run dev
```

Visit http://localhost:2333 in your browser.

## Disclaimer

This project is solely for the purpose of learning and communication of `NextJS` and `Framer motion`.

The card images used in the project are sourced from the internet and should not be used for profit-making activities.

You are also welcome to join in and create unique card UI.
