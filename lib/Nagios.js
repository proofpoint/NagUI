/* Copyright 2010-2011 Proofpoint, Inc. All rights reserved.

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

if(typeof NagUI == 'undefined')
{
	Ext.namespace('NagUI');
	NagUI.log = function(log) {
	    if (window.console) {
	        console.log(log);
	    }
	}
	Date.prototype.format=function(f)
	{
		return Ext.util.Format.date(this,f);
	}
}
NagUI.urlQuery=Ext.urlDecode(window.location.search.replace("?",""));
NagUI.nagios_write=false;
NagUI.url='/nagui/nagios_live.cgi';
NagUI.nodeQueries={
	// search is overwritten when doing the nagios searchbre
	search:''
};

NagUI.toggleLiveLog=function(logPanel){
	if(logPanel.liveTask)
	{
		Ext.util.TaskManager.stop(logPanel.liveTask);
		logPanel.liveTask=false;
		return;
	}
	logPanel.liveTask=Ext.util.TaskManager.start({
		run: function(){
			var time=Ext.Date.format(new Date(),'U')-200;
			if(this.store.max('time') > time)
			{
				time=this.store.max('time')+1;	
			}
			this.getLogs({addRecords:true,rawquery: 'GET log|Columns: type host_name message lineno options contact_name service_description plugin_output state attempt class state_type time type command_name|Filter: state_type ~~ HARD|Filter: state_type ~~ DOWN|Or: 2|Filter: time >= ' + time });
		},
		scope: logPanel,
		interval: 10000
	});
}

// synchronous call to get services for a host and check state for WARN/CRIT
NagUI.validateServicesOK=function(system){	
	var url=NagUI.url, 
	xhr, status, onScriptError;
	url+='?query=GET services|Columns: host_name description state|Filter: host_name ~~ ' + system + '|Filter: host_address ~~ ' + system + '|Filter: host_alias ~~ ' + system + '|Or: 3';

	if (typeof XMLHttpRequest !== 'undefined') {
	    xhr = new XMLHttpRequest();
	} else {
	    xhr = new ActiveXObject('Microsoft.XMLHTTP');
	}

	xhr.open('GET', url, false);
	xhr.send(null);

	status = (xhr.status === 1223) ? 204 : xhr.status;

	if (status >= 200 && status < 300) {

		var res=Ext.decode(xhr.responseText);
		var rtn=[];
		if(res.length==0)
		{
			rtn.push('Error, no services found');
			return false;
		}
		else
		{
			Ext.each(res, function(i){
				if(i.state == 1 || i.state == 2)
				{
					rtn.push(i);
				}
			});
			if(rtn.length)
			{
				return false;
			}
		}
		
		return true;
	}
	else {
	    onError.call(this, "Failed loading nagios info via XHR: '" + url + "'; " +
	                       "XHR status code: " + status);
		return false;
	}
};
