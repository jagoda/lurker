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
	export CLIENT_ID="GitHub client ID"
	export CLIENT_SECRET="GitHub client secret"
	export SECRET="a shared secret"
	npm start

The `SECRET` environment variable is required in order for `lurker` to verify
webhook requests. The `CLIENT_ID` and `CLIENT_SECRET` environment variables
are also required and are used to verify requests to the [cube][cube]
pass-through API (via [badge][badge]). The port that the server listens on can
also be configured using the `PORT` environment variable. By default `lurker`
listens on 8080.

## Cube Pass-Through API

Since [cube][cube] does not have built-in security, `lurker` provides a
pass-through API that secures the [cube][cube] endpoints. The collector is
available at `/collector` and the evaluator is at `/evaluator`. Both endpoints
require a header of the form `Authorization: token <token>` where the token is
is a valid GitHub token associated with the `CLIENT_ID` and `CLIENT_SECRET`.
Other than the authentication header, all the other API functions behave as
normal. Please see the [cube documentation][cube] for more details.

## Supported Webhooks

| Hook   | Endpoint  |
|--------|-----------|
| GitHub | `/github` |

[badge]: https://github.com/jagoda/badge "Badge"
[cube]: https://github.com/square/cube "Cube"
