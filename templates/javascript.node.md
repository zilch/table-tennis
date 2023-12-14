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

function send(channel, botInstanceId, payload) {
  let message = `\n<<zilch>>.${channel}`;

  if (botInstanceId) {
    message += "." + botInstanceId;
  }

  if (payload) {
    message += "." + payload;
  }

  message += "\n";

  process.stderr.write(message);
}

function parsePayload(payload) {
  const [eastPaddleX, eastPaddleY, westPaddleX, westPaddleY, ballX, ballY] =
    payload.split(",").map((value) => {
      return parseFloat(value);
    });

  return [
    {
      x: eastPaddleX,
      y: eastPaddleY,
    },
    {
      x: westPaddleX,
      y: westPaddleY,
    },
    {
      x: ballX,
      y: ballY,
    },
  ];
}

const bots = new Map();

process.stdin.on("data", async (chunk) => {
  const data = chunk.toString().trim();
  const [channel, botInstanceId] = data.split(".", 2);
  const payload = data.slice(channel.length + botInstanceId.length + 2);

  if (channel === "start") {
    const standardCustomConfigSplit = payload.indexOf(".");
    const standardConfigParts = payload
      .slice(0, standardCustomConfigSplit)
      .split(",");

    const config = {
      botInstanceId,
      gameTimeLimit: parseInt(standardConfigParts[0]),
      turnTimeLimit: parseInt(standardConfigParts[1]),
      paddle: standardConfigParts[2] === "0" ? "east" : "west",
    };

    bots.set(botInstanceId, new Bot(config));

    send("start", botInstanceId);
    return;
  }

  const bot = bots.get(botInstanceId);

  if (!bot) {
    throw new Error("No bot runner with id " + botInstanceId);
  }

  if (channel === "move") {
    const move = await bot.move(...parsePayload(payload));
    send("move", botInstanceId, move);
    return;
  }

  if (channel === "end") {
    await bot.end(...parsePayload(payload));
    bots.delete(botInstanceId);
    return;
  }
});

send("ready");
```

```js file=/bot.js
// 👋 Hello there! This file contains ready-to-edit bot code.
// 🟢 Open "README.md" for instructions on how to get started!

class Bot {
  constructor(config) {
    this.config = config;
    console.log("Hello world!", this.config);
  }

  move(eastPaddle, westPaddle, ball) {
    // Determine which paddle you control.
    const paddle = this.config.paddle === "east" ? eastPaddle : westPaddle;

    // This prints the position of your paddle and the ball to the bot terminal.
    // Use these values to determine which direction your paddle should move so
    // you hit the ball!
    console.log("paddle", paddle.x, paddle.y);
    console.log("ball", ball.x, ball.y);

    // Return the direction you'd like to move here:
    // "north" "south" "east" "west" or "none"
    return "none";
  }

  end(eastPaddle, westPaddle, ball) {
    console.log("Good game!");
  }
}

module.exports.Bot = Bot;
```
