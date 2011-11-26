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

var nagiosTemplates={
	hostgroup:new Ext.XTemplate(
		'<div class=x-nagios-statuspanel>',
		'Name: {name}<br/>',
		'Hosts: {num_hosts}  UP: {num_hosts_up}<br/>',
		'Services OK: <span class=pp-nagios-0>{num_services_ok}</span>',
		' Warning: <span class=pp-nagios-1>{num_services_warn}</span>',
		' Critical: <span class=pp-nagios-2>{num_services_crit}</span>',
		' Unknown: <span class=pp-nagios-3>{num_services_unknown}</span>',
		'</div>',
		{
			asDate:displayDate,
			stateText:displayState
		}),
	service:new Ext.XTemplate(
		'<div class=x-nagios-statuspanel>',
		'Hostname: {host_name}<br />',
		'Address: {host_address}<br />Service: {description}<br />',
		'State: <span class=pp-nagios-{state}>{[this.stateText(values.state)]}</span><br />',
		'Output: <span style="background-color:white;padding-left:2px;padding-right:2px;">{plugin_output}</span> <br />',
		'Last check: {[this.asDate(values.last_check)]}<br />',
		'Next check: {[this.asDate(values.next_check)]}<br />',
		'Last State Change: {[this.asDate(values.last_hard_state_change)]}<br />',
		'Notification Period: {notification_period}<br />',
		'Notes: <a target=_new href="{notes_url}">{notes_url}</a><br />',
		'Comments: <br />',
		'<tpl for="comments_with_info">',
			'{2} - <span style="font-size:7pt;font-style:italic;">{1}</span>;  <br />',
		'</tpl>',
		'</div>',
		{
			asDate:displayDate,
			stateText:displayState
		}),
	host:new Ext.XTemplate(
		'<div class=x-nagios-statuspanel>',
		'Hostname: {name}<br />',
		'Address: {address}<br />',
		'Services: ',
		'<tpl for="services_with_state">',
			' <span class=pp-nagios-{1}>{0}</span>  ',
		'</tpl><br />',
		'Hostgroups: {groups}<br />',
		'Last check: {[this.asDate(values.last_check)]} Next check: {[this.asDate(values.next_check)]}  Last State Change: {[this.asDate(values.last_hard_state_change)]}<br />',
		'Notes: <a target=_new href="{notes_url}">{notes_url}</a> <br />',
		'Comments: ',
		'<tpl for="comments_with_info">',
		'{2} - <span style="font-size:7pt;font-style:italic;">{1}</span>;  ',
		'</tpl>',
		'</div>',
		{
			asDate:displayDate,
			stateText:displayState
		})
};

var ticketTemplates={
	service:new Ext.XTemplate(
		'Hostname: {host_name} : {host_address}, Service: {description} \n',
		'State: {[this.stateText(values.state)]}  Output: {plugin_output} \n',
		'Date/Time: {[this.asDate(values.last_hard_state_change)]} ',
		'Notes: {notes_url} \n',
		{
			asDate:displayDate,
			stateText:displayState
		}),
	host:new Ext.XTemplate(
		'Hostname: {name} : {address}\n',
		// 'Services: ',
		// '<tpl for="services_with_state">',
		// 	' <span class=pp-nagios-{1}>{0}</span>  ',
		// '</tpl><br />',
		// 'Hostgroups: {groups}<br />',
		'Date/Time: {[this.asDate(values.last_hard_state_change)]} \n',
		'Notes: {notes_url} /n',
		'Comments: ',
		{
			asDate:displayDate,
			stateText:displayState
		})
};
var test='yay';


function displayDate(value){
	value=value*1000;
	var dt=new Date(value);
	return dt.format('Y-m-d H:i:s (T)');
}
function displayState(value){
	if(value==0)
	{
		return 'OK';
	}
	if(value==1)
	{
		return 'Warning';
	}
	if(value==2)
	{
		return 'Critical';
	}
	if(value==3)
	{
		return 'Unknown';
	}
}