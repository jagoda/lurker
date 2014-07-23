lurker
======

[![Build Status](https://travis-ci.org/jagoda/lurker.svg?branch=master)](https://travis-ci.org/jagoda/lurker)

> Workflow analytics.

## Overview

**Prerequisites**:
 + [cube][cube]

`lurker` uses [cube][cube] to collect metrics about and create reports around
process workflows. Assuming the prerequisites are installed, the server can
be setup using the following:

	git clone https://github.com/jagoda/lurker.git /opt/lurker
	cd /opt/lurker
	npm install
	SECRET="a shared secret" npm start

The `SECRET` environment variable is required in order for `lurker` to verify
webhook requests. The port that the server listens on can also be configured
using the `PORT` environment variable. By default `lurker` listens on 8080.

## Supported Webhooks

| Hook   | Endpoint  |
|--------|-----------|
| GitHub | `/github` |

[cube]: https://github.com/square/cube "Cube"
