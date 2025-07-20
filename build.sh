#! /usr/bin/env zsh

set -e

git add .

mes=${1:-"updates"}
git commit -m $mes

git push
