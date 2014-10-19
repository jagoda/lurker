lurker
======

[![Build Status](https://travis-ci.org/jagoda/lurker.svg?branch=master)](https://travis-ci.org/jagoda/lurker)

> Workflow analytics.

## Overview

**Prerequisites**:
 + [influxdb][influxdb]

`lurker` collects metrics about process workflows and facilitates the creation
of reports based on these metrics. Assuming the prerequisites are installed, the
server can be setup using the following:

	git clone https://github.com/jagoda/lurker.git /opt/lurker
	cd /opt/lurker
	npm install
	export INFLUXDB_URL="<your influxdb database>"
	export GITHUB_ORGANIZATION="GitHub organization"
	export GITHUB_SECRET="a shared secret"
	npm start

The `GITHUB_SECRET` environment variable is required in order for `lurker` to
verify webhook requests. The `GITHUB_ORGANIZATION` environment variable
specifies which GitHub organization's members will be allowed to access the
status UI. The port that the server listens on can also be configured using the
`PORT` environment variable. By default `lurker` listens on 8080.

## Supported Webhooks

| Hook   | Endpoint  |
|--------|-----------|
| GitHub | `/github` |

[badge]: https://github.com/jagoda/badge "Badge"
[influxdb]: http://influxdb.com/ "InfluxDB"
