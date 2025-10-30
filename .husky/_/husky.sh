#!/bin/sh
if [ -z "$husky_skip_init" ]; then
  husky_skip_init=1
  export husky_skip_init

  if [ "$HUSKY" = "0" ]; then
    exit 0
  fi

  if [ -f ~/.huskyrc ]; then
    . ~/.huskyrc
  fi
fi
