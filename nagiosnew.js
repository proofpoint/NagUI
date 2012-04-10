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

Ext.define('NagUI.FilterItem',{
	extend: 'Ext.menu.CheckItem',
	alias: 'widget.filteritem',
	hideOnClick:true,
	checked: false,
	handler:function(b,e){
		var tab=Ext.getCmp('nagios_views').getActiveTab();
		if(b.checked)
		{
			tab.store.customHostFilters.push(b.HostFilter);
			tab.store.customServiceFilters.push(b.ServiceFilter);
		}
		else
		{
			Ext.Array.remove(tab.store.customHostFilters,b.HostFilter);
			Ext.Array.remove(tab.store.customServiceFilters,b.ServiceFilter);
		}
	}
	
});


NagUI.nagiosServerStatusWindow=function(config){
	var t=new Ext.TabPanel();
	var w=new Ext.Window({
		height:600,
		title:'Nagios Servers',
		width: 500,
		layout:'fit',
		items: t
	});
	w.show();
	w.getEl().mask('Loading...');
	Ext.Ajax.request({
		url: NagUI.url,
		method: 'GET',
		params: {
			query:'GET services|Filter: active_checks_enabled = 1|Stats: min latency|Stats: max latency|Stats: avg latency|Stats: max execution_time|Stats: avg execution_time|Stats: min execution_time'
		},
		window:w,
		success: function(r,o){
			var stats=Ext.decode(r.responseText);
			Ext.each(stats,function(i){
				var peer=NagUI.nagiosServers.getById(i.peer_name);
				if(peer)
				{
					Ext.apply(NagUI.nagiosServers.getById(i.peer_name).data,i);
				}
			});
			t.removeAll(true);
			NagUI.nagiosServers.each(function(i){
				NagUI.log(i.data);
				var newc=t.add(
					{
						xtype: 'panel',
						layout: 'border',
						title: i.get('peer_name'),
						iconCls: (i.data.error_code ? 'x-tree-problem' : undefined),
						items:[
							Ext.create('Ext.grid.property.Grid',{
								region: 'center',
								source:i.data,
								nameColumnWidth:220,
								listeners:{
									'beforeedit':{
										fn: function(){
											return false;
										}
									}
								},
								tbar:[
								{
									text: 'Actions',
									menu:{
										items:[
											{
												text:'Enable Notifications',
												handler:function(){
													var str='COMMAND ['+ new Date().format('U') + '] ' + 'ENABLE_NOTIFICATIONS';
													sendNagiosCommand(str,'GET',t.getActiveTab().title);
												}
											},
											{
												text: 'Disable Notifications',
												handler:function(){
													var str='COMMAND ['+ new Date().format('U') + '] ' + 'DISABLE_NOTIFICATIONS';
													sendNagiosCommand(str,'GET',t.getActiveTab().title);
												}
											},
											{
												text: 'Start Executing Host Checks',
												handler:function(){
													var str='COMMAND ['+ new Date().format('U') + '] ' + 'START_EXECUTING_HOST_CHECKS';
													sendNagiosCommand(str,'GET',t.getActiveTab().title);
												}
											},
											{
												text: 'Stop Executing Host Checks',
												handler:function(){
													var str='COMMAND ['+ new Date().format('U') + '] ' + 'STOP_EXECUTING_HOST_CHECKS';
													sendNagiosCommand(str,'GET',t.getActiveTab().title);
												}
											},
											{
												text: 'Start Executing Service Checks',
												handler:function(){
													var str='COMMAND ['+ new Date().format('U') + '] ' + 'START_EXECUTING_SVC_CHECKS';
													sendNagiosCommand(str,'GET',t.getActiveTab().title);
												}
											},
											{
												text: 'Stop Executing Service Checks',
												handler:function(){
													var str='COMMAND ['+ new Date().format('U') + '] ' + 'STOP_EXECUTING_SVC_CHECKS';
													sendNagiosCommand(str,'GET',t.getActiveTab().title);
												}
											},
											{
												text: 'Start Accepting Passive Service Checks',
												handler:function(){
													var str='COMMAND ['+ new Date().format('U') + '] ' + 'START_ACCEPTING_PASSIVE_SVC_CHECKS';
													sendNagiosCommand(str,'GET',t.getActiveTab().title);
												}
											},
											{
												text: 'Stop Accepting Passive Service Checks',
												handler:function(){
													var str='COMMAND ['+ new Date().format('U') + '] ' + 'STOP_ACCEPTING_PASSIVE_SVC_CHECKS9';
													sendNagiosCommand(str,'GET',t.getActiveTab().title);
												}
											},
											{
												text:'Enable Event Handlers',
												handler:function(){
													var str='COMMAND ['+ new Date().format('U') + '] ' + 'ENABLE_EVENT_HANDLERS';
													sendNagiosCommand(str,'GET',t.getActiveTab().title);
												}
											},
											{
												text: 'Disable Event Handlers',
												handler:function(){
													var str='COMMAND ['+ new Date().format('U') + '] ' + 'DISABLE_EVENT_HANDLERS';
													sendNagiosCommand(str,'GET',t.getActiveTab().title);
												}
											},
											{
												text: 'Enable Performance Data Processing',
												handler:function(){
													var str='COMMAND ['+ new Date().format('U') + '] ' + 'ENABLE_PERFORMANCE_DATA';
													sendNagiosCommand(str,'GET',t.getActiveTab().title);
												}
											},
											{
												text: 'Disable Performance Data Processing',
												handler:function(){
													var str='COMMAND ['+ new Date().format('U') + '] ' + 'DISABLE_PERFORMANCE_DATA';
													sendNagiosCommand(str,'GET',t.getActiveTab().title);
												}
											},
											{
												text: 'Send Restart Cmd',
												handler:function(){
													var str='COMMAND ['+ new Date().format('U') + '] ' + 'RESTART_PROGRAM';
													sendNagiosCommand(str,'GET',t.getActiveTab().title);
												}
											}
										]
									}									
								}
								]
							})
						]
					}
				);
				if(i.data.error_code)
				{
					newc.getEl().mask('Nagios Server Status error: ' + i.data.error_str);
				}		
			});	
			o.window.getEl().unmask();
			t.getActiveTab().doLayout();		
		}
	});
	return w;
}


function nagiosStatus()
{
	NagUI.nagiosServers.load({callback:function(){
		var data={
			hosts_active:0,
			hosts_passive:0,
			services_active:0,
			services_passive:0
		};
		NagUI.nagiosServers.each(function(r){
			data.hosts_active=data.hosts_active+ (r.get('hosts_active') ? r.get('hosts_active') : 0);
			data.hosts_passive=data.hosts_passive+(r.get('hosts_passive') ? r.get('hosts_passive') : 0);
			data.services_active=data.services_active+(r.get('services_active') ? r.get('services_active') : 0 );
			data.services_passive=data.services_passive+(r.get('services_passive') ? r.get('services_passive') : 0 );
		});
		var str='';
		if(typeof (NagUI.nagiosServers.sum('error_code') * 1) == 'number' && (NagUI.nagiosServers.sum('error_code') * 1) > 0)
		{
			str+=' <div class=x-nagios-status-error data-qtip:"There were error(s) retrieving nagios server info"> !!! </div> ';
		}
		str+='<div>Hosts (active/passive): ' + data.hosts_active + " / " + data.hosts_passive;
		str+='<br/>Services (active/passive): ' + data.services_active + ' / ' + data.services_passive + '</div>';
		Ext.getCmp('statusbox').getEl().update(str);			
		//Ext.getCmp('statusboxbutton').setText(str);			
		Ext.defer(nagiosStatus,20000);
	}});	
}



function getColumnsForNagiosType(nagiosType)
{
	if(nagiosType[nagiosType.length-1] == 's')
	{
		nagiosType=nagiosType.slice(0,nagiosType.length-1);
	}
	switch(nagiosType)
	{
		case 'hostgroup' : 
			return 'name num_hosts num_services_ok num_services_warn num_services_crit num_services_unknown';
			break;			
		case 'host' : 
			return 'notification_period address groups notes notes_url scheduled_downtime_depth next_check downtimes_with_info notifications_enabled comments_with_info acknowledged last_check last_hard_state_change name num_services_ok num_services_warn num_services_crit num_services_unknown state';
			break;
		case 'service' :	
			return 'notes host_notes notification_period host_address notes_url scheduled_downtime_depth host_scheduled_downtime_depth next_check downtimes_with_info notifications_enabled comments_with_info acknowledged last_check last_hard_state_change plugin_output host_name description host_groups groups state';
			break;
	}
	
}

NagUI.setupLogWindow=function(c,target)
{
	NagUI.log(c);
	var l=new NagUI.NagiosLogGrid();
	var w=new Ext.Window({
		height: 500,
		width: 800,
		title: 'Logs for ' + (c['host_name'] ? c['host_name'] : '') +  ' ' + ( c['service_description'] ? c['service_description'] : ''),
		layout: 'fit',
		items:l
	});
	w.show(target,function(){
		l.getLogs(c);
	});
	return l;
}


function nagiosSearch(term,opts)
{
	if(!term || typeof term == 'object')
	{
		term=Ext.getCmp('search_input').getValue();
	}
	var searchPanel=Ext.getCmp('nagios_search');
	Ext.getCmp('nagios_views').setActiveTab(searchPanel);
	var searchView=searchPanel.view;
	var search=searchPanel.store.getRootNode();
	search.data.loaded=false;
	var type=Ext.getCmp('search_type').searchtype;
	search.collapse();
	search.removeAll();
	
	Ext.fly(searchView.getNode(search)).addCls(searchView.loadingCls);
	
	search.data.parms={
		mode: 'treeloader',
		nodetext: ( type=='service' ? 'hostsvc' : 'name' ) ,
		query: 'search'
	};
	if(type == 'hostgroup')
	{
		NagUI.nodeQueries.search= 'GET ' + type + 's|Columns: ' + getColumnsForNagiosType(type) + '|Filter: name ~~ ' + term;		
	}
	if(type == 'host')
	{
		NagUI.nodeQueries.search= 'GET ' + type + 's|Columns: ' + getColumnsForNagiosType(type) + '|Filter: name ~~ ' + term + '|Filter: address ~~ ' + term + '|Filter: alias ~~ ' + term + '|Filter: notes ~~ ' + term + '|Or: 4';		
	}
	if(type == 'service')
	{
		NagUI.nodeQueries.search= 'GET ' + type + 's|Columns: ' + getColumnsForNagiosType(type) + '|Filter: host_name ~~ ' + term + '|Filter: host_address ~~ ' + term + '|Filter: host_alias ~~ ' + term +'|Filter: description ~~ ' + term + '|Filter: plugin_output ~~ ' + term + '|Filter: host_notes ~~ ' + term + '|Or: 6';				
	}
	search.expand();
	
}
function toggleAutoRefresh(i,tree)
{
	var menu=i.ownerCt;
	if(!i.checked)
	{
		tree.autoRefresh=0;
		if(typeof tree.refreshTask!='undefined')
		{
			Ext.TaskManager.stop(tree.refreshTask);
		}
		delete tree.refreshTask;
	}
	else
	{
		if(typeof tree.refreshTask!='undefined')
		{
			Ext.TaskManager.stop(tree.refreshTask);
		}
		tree.autoRefresh=i.time;		
		tree.refreshTask={
			run: function(){
				tree.refresh();
			},
			interval: i.time * 1000
		};
		Ext.TaskManager.start(tree.refreshTask);	
		menu.items.each(function(k){
			if(typeof k.setChecked == 'undefined')
			{
				return;
			}
			if(k.time == i.time)
			{
				return;
			}
			else
			{
				k.setChecked(false);
			}
		});			
	}
}


function nagiosTextRender(value,o,r,row,col,store){
	if(typeof r.state=='undefined')
	{
		return value;
	}
	else
	{
		
	}
}
function nagiosBoolRender(value)
{
	if(value == '0' || value == 0)
	{
		return 'Off';
	}
	return 'On';
}
function nagiosStateRender(value)
{
	if(value == '0') return '<span class=statusOK>OK</span>';
	if(value == '1') return '<span class=statusWarning>Warning</span>';
	if(value == '2') return '<span class=statusCritical>Critical</span>';
	if(value == '3') return '<span class=statusUnknown>Unknown</span>';
}

function setNagiosInfo(node,target)
{
	//Ext.getCmp('nagiosdetail').getEl().update('');
	target.setLoading(true);
	var filter_keys={
		hostgroup:'Filter: name',
		host:'name',
		service:''
	};
	var query='GET ' + node.data.nagios_type + 's';
	query+= node.data.nagios_type == 'host' ? '|Filter: name = ' + node.data.name : '';
	query+= node.data.nagios_type == 'service' ? '|Filter: description = ' + node.data.description : '';
	query+= node.data.nagios_type == 'service' ? '|Filter: host_name = ' + node.data.host_name : '';
	query+= node.data.nagios_type == 'hostgroup' ? '|Filter: name = ' + node.data.name : '';

	Ext.Ajax.request({
		url: NagUI.url,
		method: 'GET',
		nagios_type: node.data.nagios_type,
		params:{
			query:query,
			mode: 'treeloader',
			method:'GET',
			nodetext:'name',
			status: node.data.nagios_type + 's',
			peer_name: ( node.data.nagios_type == 'host' || node.data.nagios_type == 'service' ? node.data.peer_name : '' )
		},
		success: function(r,o)
		{
			if(r.responseText)
			{
				var d=Ext.decode(r.responseText);
				var info=nagiosTemplates[o.nagios_type].apply(d[0]);
				target.update(replaceURLWithHTMLLinks(info));
				var detail=Ext.getCmp('nagiosdetaildata');
				detail.setSource(d[0]);
				// detail.invalidateScroller();
				
			}	
			target.setLoading(false);
		},
		failure: function(r,o)
		{
			target.setLoading(false);
		}
	});
}


function addCustomView(name){
	var views=Ext.getCmp('nagios_views');
	if(typeof name !='string')
	{
		 name='View ' + views.items.getCount();
	}
	var newcustomview= views.add(new NagUI.NagiosTree({
		title: name,
		stateId: name.replace(' ','-'),
		allowDrop:true,
		rootVisible:true,
		closable:true,
		listeners:{
			'itemclick': updateNagiosInfoPanel,
		},
		// stateful:true,
		// statefulNodes:true,
		viewConfig: {
			animate: false,
			allowCopy: true,
			loadMask: false,
            plugins: {
                ptype: 'treeviewdragdrop',
				allowContainerDrops: true,
				ddGroup: 'nagiosDD',
                enableDrop: true,
				onContainerDrop:function(source, e, data){
					data.copy=true;
					var node=dropTree.store.root.appendChild(data.node);
					if(node)
					{
						node.data.allowDrop=false;
					}
					return true;
				},
			    onContainerOver : function(dd, e, data) {
					data.copy=true;
			        return e.getTarget('.' + this.indicatorCls) ? this.currentCls : this.dropAllowed;
			    }
			},
			listeners: {
				beforedrop : function(de,data) {
					data.copy=true;
				}
			}

        },
		store:new NagUI.NagiosStore({
			root: {
				loaded:true,
				expanded:true,
				text: 'Custom View',
				meta: 1
			},
			customHostFilters:['Filter: name != dummy-host-all-services'],
			customServiceFilters:['Filter: host_name !~ dummy-host-all-services']
		})
	}));
	views.setActiveTab(newcustomview);
	newcustomview.store.getRootNode().loaded=true;
	NagUI.log(newcustomview);
	return newcustomview;
}

function replaceURLWithHTMLLinks(text) {
  var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;\*]*[-A-Z0-9+&@#\/%=~_|])/ig;
  return text.replace(exp,"<a target=_new href='$1'>$1</a>"); 
}
function updateNagiosInfoPanel(view,node)
{
	var nagiosdetail=Ext.getCmp('nagiosdetail');
	setNagiosInfo(node,nagiosdetail);
	nagiosdetail.node=node;
}

function restoreCustomViews()
{
	
	var savedViews=Ext.getCmp('saved_views');
	savedViews.suspendEvents();
	Ext.Ajax.request({
		url: NagUI.url + '?state=default',
		method: 'GET',
		success: function(r,o)
		{
            var views=(r.responseText.length>1 ? Ext.decode(r.responseText) : []);
			savedViews.getRootNode().childNodes[0].removeAll();
			Ext.each(views,function(i){
				savedViews.getRootNode().childNodes[0].appendChild({
					text: i.text,
					viewstate: i.viewstate,
					leaf:true
				});
			});
			Ext.defer(savedViews.resumeEvents,1500,savedViews);
		},
		failure: function(r,o)
		{
			Ext.notify.msg('Error','There was an error restoring the default saved views');
		}
	});
	Ext.Ajax.request({
		url: NagUI.url + '?state=' + NagUI.username + '_views',
		method: 'GET',
		success: function(r,o)
		{
            var views=(r.responseText.length>1 ? Ext.decode(r.responseText) : []);
			savedViews.getRootNode().childNodes[1].removeAll();
			Ext.each(views,function(i){
				savedViews.getRootNode().childNodes[1].appendChild({
					text: i.text,
					viewstate: i.viewstate,
					leaf:true
				});
			});
			Ext.defer(savedViews.resumeEvents,1500,savedViews);
		},
		failure: function(r,o)
		{
			Ext.notify.msg('Error','There was an error restoring the user saved views');
		}
	});
	Ext.defer(restoreCustomViews,150000);
}

function saveCustomView(view)
{
	var savedViews=Ext.getCmp('saved_views');
	if( savedViews.getRootNode().childNodes[1].findChild('text',view.getStateId()) )
	{
		savedViews.getRootNode().childNodes[1].replaceChild({
			text:view.getStateId(), 
			id:view.getStateId(),
			saveid:view.getStateId(),
			viewstate: view.getState(),
			leaf: true 
		},savedViews.getRootNode().childNodes[1].findChild('text',view.getStateId()));
	}
	else
	{
		savedViews.getRootNode().childNodes[1].appendChild({
			text:view.getStateId(), 
			id:view.getStateId(),
			saveid:view.getStateId(),
			viewstate: view.getState(),
			leaf:true 
		});
	}
}

function persistSavedViews(viewtype)
{
	var savedViews=[];
	var parentNode;
	if(viewtype!='default')
	{
		viewtype=NagUI.username;
		parentNode=Ext.getCmp('saved_views').getRootNode().childNodes[1];
	}
	else
	{
		parentNode=Ext.getCmp('saved_views').getRootNode().childNodes[0];		
	}
	Ext.each(parentNode.childNodes,function(i){
		savedViews.push({
			text:i.data.text,
			viewstate: i.data.viewstate
		});
	});
	Ext.Ajax.request({
		url: NagUI.url + '?state=' + viewtype,
		method: 'POST',
		jsonData: savedViews,
		failure: function(r,o)
		{
			Ext.msg.show('Error','There was an error saving the view');
			// target.setLoading(false);
		}
	});
	
}

Ext.notify = function(){
    var msgCt;

    function createBox(t, s){
       return '<div class="msg"><h3>' + t + '</h3><p>' + s + '</p></div>';
    }
    return {
        msg : function(title, format){
            if(!msgCt){
                msgCt = Ext.core.DomHelper.insertFirst(document.body, {id:'msg-div'}, true);
            }
            var s = Ext.String.format.apply(String, Array.prototype.slice.call(arguments, 1));
            var m = Ext.core.DomHelper.append(msgCt, createBox(title, s), true);
            m.hide();
            m.slideIn('t').ghost("t", { delay: 1000, remove: true});
        },

        init : function(){
        }
    };
}();

