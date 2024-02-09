```sh config=run
python3 -u ./main.py
```

```md file=/README.md
Check if you have Python 3 installed on your system like this:

\`\`\`
python3 --version
\`\`\`

If you receive a `command not found` error follow the instructions
at https://www.python.org/ to get up and running. Once you have Python
on your system you should be good to go! Run `./connect` from the
bot directory to play.
```

```py file=/main.py hidden=true
import sys
from bot import Bot

def send(channel: str, *args):
    payload = args[0] if len(args) > 0 else None

    message = "\n<<zilch>>." + channel

    if payload is not None:
        message += "." + payload

    message += "\n"

    print(message, end="", file=sys.stderr)

def parse_payload(payload):
    parts = payload.split(",")

    return [
        {
            "x": float(parts[0]),
            "y": float(parts[1])
        },
        {
            "x": float(parts[2]),
            "y": float(parts[3])
        }
    ]

send("ready")

bot: Bot = None

while True:
    data = sys.stdin.readline().strip()
    channel, payload = data.split(".", 1)

    if channel == "start":
        standard_config, custom_config = payload.split(".", 1)
        game_time_limit, turn_time_limit, player = standard_config.split(",", 2)
        config = {
            "game_time_limit": int(game_time_limit),
            "turn_time_limit": int(turn_time_limit),
            "paddle": "west" if player == "0" else "east"
        }
        bot = Bot(config)
        send("start")
        continue

    if channel == "move":
        move = bot.move(*parse_payload(payload))
        send("move", move)
        continue

    if channel == "end":
        bot.end(*parse_payload(payload))
        continue
```

```py file=/bot.py
# 👋 Hello there! This file contains ready-to-edit bot code.
# 🟢 Open "README.md" for instructions on how to get started!
# TL;DR Run ./connect (or .\connect.cmd on Windows) to begin.

class Bot:
    def __init__(self, config):
        print("Hello World!", config)
        self.config = config

    def move(self, paddle, ball):
        # This prints the position of your paddle and the ball to the bot terminal.
        # Use these values to determine which direction your paddle should move so
        # you hit the ball!
        print("paddle", paddle["x"], paddle["y"])
        print("ball", ball["x"], ball["y"])

        # Return the direction you'd like to move here:
        # "north" "south" "east" "west" or "none"
        return "none"

    def end(self, paddle, ball):
        print("Good game!")
```

```sh file=/.gitignore hidden=true
# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# PyInstaller
#  Usually these files are written by a python script from a template
#  before PyInstaller builds the exe, so as to inject date/other infos into it.
*.manifest
*.spec

# Installer logs
pip-log.txt
pip-delete-this-directory.txt

# Unit test / coverage reports
htmlcov/
.tox/
.nox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.py,cover
.hypothesis/
.pytest_cache/
cover/

# Translations
*.mo
*.pot

# Django stuff:
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal

# Flask stuff:
instance/
.webassets-cache

# Scrapy stuff:
.scrapy

# Sphinx documentation
docs/_build/

# PyBuilder
.pybuilder/
target/

# Jupyter Notebook
.ipynb_checkpoints

# IPython
profile_default/
ipython_config.py

# pyenv
#   For a library or package, you might want to ignore these files since the code is
#   intended to run in multiple environments; otherwise, check them in:
# .python-version

# pipenv
#   According to pypa/pipenv#598, it is recommended to include Pipfile.lock in version control.
#   However, in case of collaboration, if having platform-specific dependencies or dependencies
#   having no cross-platform support, pipenv may install dependencies that don't work, or not
#   install all needed dependencies.
#Pipfile.lock

# poetry
#   Similar to Pipfile.lock, it is generally recommended to include poetry.lock in version control.
#   This is especially recommended for binary packages to ensure reproducibility, and is more
#   commonly ignored for libraries.
#   https://python-poetry.org/docs/basic-usage/#commit-your-poetrylock-file-to-version-control
#poetry.lock

# pdm
#   Similar to Pipfile.lock, it is generally recommended to include pdm.lock in version control.
#pdm.lock
#   pdm stores project-wide configurations in .pdm.toml, but it is recommended to not include it
#   in version control.
#   https://pdm.fming.dev/#use-with-ide
.pdm.toml

# PEP 582; used by e.g. github.com/David-OConnor/pyflow and github.com/pdm-project/pdm
__pypackages__/

# Celery stuff
celerybeat-schedule
celerybeat.pid

# SageMath parsed files
*.sage.py

# Environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# Spyder project settings
.spyderproject
.spyproject

# Rope project settings
.ropeproject

# mkdocs documentation
/site

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# Pyre type checker
.pyre/

# pytype static type analyzer
.pytype/

# Cython debug symbols
cython_debug/

# PyCharm
#  JetBrains specific template is maintained in a separate JetBrains.gitignore that can
#  be found at https://github.com/github/gitignore/blob/main/Global/JetBrains.gitignore
#  and can be added to the global gitignore or merged into this file.  For a more nuclear
#  option (not recommended) you can uncomment the following to ignore the entire idea folder.
#.idea/
```
