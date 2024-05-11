# NANA在线桌游

一款在线多人卡牌桌游，用浏览器访问[https://nana.cyron.site](https://nana.cyron.site)即可开始游玩，支持创建房间和加入他人的房间。

![](https://github.com/Cyronlee/nana-card-game/blob/master/public/img/example.png?raw=true)

此网站托管在`Vercel`上，使用`NextJS`和`Framer motion`制作，使用`Vercel KV(Redis)`存储服务器状态，整个架构完全免费。

⚠️存在的问题：Vercel KV免费版每天有10000次调用限制，仅足够6人玩30分钟，游戏中可能会遇到由此引发的错误；你可以尝试自己部署此项目并分享给你的朋友们；我也在尝试其他的途径来解决这个问题。

## 开发路线

欢迎你加入一起开发更多的功能，也欢迎提交issue帮助项目完善。

- [x] 多人在线游玩
- [x] 音效
- [ ] 国际化
- [ ] 小屏幕适配
- [ ] 不同人数下的座位布局优化
- [ ] 记分板
- [ ] PWA模式
- [ ] 使用WebRTC共享玩家的鼠标
- [ ] 寻找免费的Redis服务器
- [ ] 寻找免费的Websocket服务器
- [ ] 更好看的动效
- [ ] 更好看的UI

## 本地开发

```bash
npm install

npm run dev
```

在浏览器中访问[http://localhost:2333](http://localhost:2333)

## 声明

此项目仅用于交流学习`NextJS`和`Framer motion`，其中的卡牌图片来源于网络，请勿使用于盈利活动。

也欢迎你加入进来制作独一无二的卡牌UI。
