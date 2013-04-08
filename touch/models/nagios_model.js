/* `, Inc. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

Ext.define('Group',{
	extend: 'Ext.data.Model',
	config:{
		fields: [{name: 'label', mapping: 'text'},{name: 'nagios_type',defaultValue:'hostgroup'},'name','status', 'num_hosts', 'num_services_ok', 'num_services_warn', 'num_services_crit', 'num_services_unknown'],
		hasMany: {model: 'Host', name: 'hosts'},
		proxy: {
			reader: {
				type: 'json',
				root: '',
				totalProperty:undefined,
				successProperty:undefined
			},
			type: 'ajax',
			url: '../nagios_live.cgi',
			extraParams: {
				mode: 'treeloader',
				nodetext: 'name',
				status: 'services',
				query: ''
			}		
		}		
	}
});

Ext.define('Host',{
	extend: 'Ext.data.Model',
	config: {
		fields: [{name: 'label', mapping: 'text'},{name: 'nagios_type',defaultValue:'host'},'status','notification_period', 'address', 'groups', 'notes_url', 'scheduled_downtime_depth', 'next_check', 'downtimes_with_info', 'notifications_enabled', 'comments_with_info', 'acknowledged', 'last_check', 'last_hard_state_change', 'name', 'num_services_ok', 'num_services_warn', 'num_services_crit', 'num_services_unknown', {name:'state',type:'int'}],
		hasMany: {model:'Service', name: 'services'},
		proxy: {
			reader: {
				type: 'json',
				root: '',
				totalProperty:undefined,
				successProperty:undefined
			},
			type: 'ajax',
			url: '../nagios_live.cgi',
			extraParams: {
				mode: 'treeloader',
				nodetext: 'name',
				status: 'services',
				query: ''
			}		
		}
	}
});

Ext.define('Service',{
	extend: 'Ext.data.Model',
	config:{
		fields: [{name: 'label', mapping: 'text'},{name: 'nagios_type',defaultValue:'service'},'status','notification_period', 'host_address', 'notes_url', 'scheduled_downtime_depth', 'host_scheduled_downtime_depth', 'next_check', 'downtimes_with_info', 'notifications_enabled', 'comments_with_info', 'acknowledged', 'last_check', 'last_hard_state_change', 'plugin_output', 'host_name', 'description', 'host_groups', 'groups', {name:'state',type:'int'}],
		proxy: {
			reader: {
				type: 'json',
				root: '',
				totalProperty:undefined,
				successProperty:undefined
			},
			type: 'ajax',
			url: '../nagios_live.cgi',
			extraParams: {
				mode: 'treeloader',
				nodetext: 'description',
				status: 'plugin_output',
				query: ''
			}		
		}		
	}
});

NagUI.groupstore=Ext.extend(Ext.data.Store,{
	model: 'Group',
	proxy: {
		type: 'ajax',
		url: '../nagios_live.cgi',
		reader: {
			type: 'json',
			root: ''
		},
		extraParams: {
			mode: 'treeloader',
			nodetext: 'name',
			status: 'services'
		}
	},
	load: function(options){
		options.query='GET hostgroups|Columns: name num_hosts num_services_ok num_services_warn num_services_crit num_services_unknown' + options.query;
		return NagUI.groupstore.superclass.load.call(this, options);
	}
});