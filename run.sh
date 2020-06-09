#!/bin/bash
CompileDaemon -command="./scribble.rs" -exclude-dir=.git -pattern="(.+\.go|.+\.c|.+\.html|.+\.js|.+\.css)$"