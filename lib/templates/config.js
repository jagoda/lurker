/* jshint camelcase:false */
/* globals define:false */
"use strict";

define([ "settings" ], function (Settings) {
	return new Settings({
		datasources : {
			lurker : {
				type     : "influxdb",
				url      : "{{{ lurker.url }}}",
				username : "{{ lurker.username }}",
				password : "{{ lurker.password }}",
				default  : true
			},

			grafana: {
				type      : "influxdb",
				url       : "{{{ grafana.url }}}",
				username  : "{{ grafana.username }}",
				password  : "{{ grafana.password }}",
				grafanaDB : true
			},
		},

		search : {
			max_results : 20
		},

		default_route           : "/dashboard/file/default.json",
		unsaved_changes_warning : true,
		playlist_timespan       : "1m",

		admin : {
			password : ""
		},

		window_title_prefix : "Lurker - ",

		plugins : {
			panels       : [],
			dependencies : [],
		}
	});
});
