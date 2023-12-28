```sh config=run
node main.js
```

```md file=/README.md
Check if you have Node.js installed on your system like this:

\`\`\`
node --version
\`\`\`

If you receive a `command not found` error follow the instructions
at https://nodejs.org/ to get up and running. Once you have Node.js
on your system you should be good to go! Run `./connect` from the
bot directory to play.
```

```js file=/main.js hidden=true
// ⚠️ Only modify this file if you know what you're doing!
const { Bot } = require("./bot");

function send(channel, payload) {
  process.stderr.write(
    `\n<<zilch>>.${channel}${payload ? "." + payload : ""}\n`
  );
}

function parsePayload(payload) {
  const [paddleX, paddleY, ballX, ballY] = payload
    .split(",")
    .map((value) => parseFloat(value));

  return [
    { x: paddleX, y: paddleY },
    { x: ballX, y: ballY },
  ];
}

let bot;

process.stdin.on("data", async (chunk) => {
  const data = chunk.toString().trim();
  const channel = data.split(".")[0];
  const payload = data.slice(channel.length + 1);

  if (channel === "start") {
    const standardCustomConfigSplit = payload.indexOf(".");
    const standardConfigParts = payload
      .slice(0, standardCustomConfigSplit)
      .split(",");

    const config = {
      gameTimeLimit: parseInt(standardConfigParts[0]),
      turnTimeLimit: parseInt(standardConfigParts[1]),
      paddle: standardConfigParts[2] === "0" ? "east" : "west",
    };

    bot = new Bot(config);

    send("start");
    return;
  }

  if (!bot) {
    throw new Error("Bot not yet initialized.");
  }

  if (channel === "move") {
    const move = await bot.move(...parsePayload(payload));
    send("move", move);
    return;
  }

  if (channel === "end") {
    await bot.end(...parsePayload(payload));
    return;
  }
});

send("ready");
```

```js file=/bot.js
// 👋 Hello there! This file contains ready-to-edit bot code.
// 🟢 Open "README.md" for instructions on how to get started!
// TL;DR Run ./connect (or .\connect.cmd on Windows) to begin.

class Bot {
  constructor(config) {
    this.config = config;
    console.log("Hello world!", this.config);
  }

  move(paddle, ball) {
    // This prints the position of your paddle and the ball to the bot terminal.
    // Use these values to determine which direction your paddle should move so
    // you hit the ball!
    console.log("paddle", paddle.x, paddle.y);
    console.log("ball", ball.x, ball.y);

    // Return the direction you'd like to move here:
    // "north" "south" "east" "west" or "none"
    return "none";
  }

  end(paddle, ball) {
    console.log("Good game!");
  }
}

module.exports.Bot = Bot;
```
