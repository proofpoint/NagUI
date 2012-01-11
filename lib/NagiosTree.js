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

Ext.define('NagUI.NagiosTree',{
	extend: 'Ext.tree.Panel',
	alias: 'widget.nagiostree',
	require: 'NagUI.NagiosStore',
	// viewType: 'treeview',
	// selType: 'treemodel',
	useArrows: false,
	rootVisible: false,
	stateful:true,
	statefulNodes:true,
	defaultVisibleColumns:['text','status','last_check','next_check'],
	stateEvents:['hide','show','destroy','itemexpand','itemcollapse','itemappend','checkchange','itemremove','iteminsert'],    
	singleExpand: false,
	viewConfig:{ 
		loadMask: false,
		// listeners:{
		// 	'itemcontextmenu' : doNodeContextMenu,
		// 	'contextmenu' : doNodeContextMenu
		// }
	},
	listeners:{
		// 'click': updateNagiosInfoPanel,
		'itemcontextmenu' : doNodeContextMenu,
		'beforedestroy': function(){
			if(this.stateful)
			{
				Ext.state.Manager.clear(this.getStateId());
			}
		}
	},
	columns:[
		{
			xtype: 'treecolumn',
			text: 'Name',
			flex: 2,
			dataIndex: 'text',
			renderer: nagiosHostNameRender
		},
		{
			text: 'Status',
			dataIndex: 'status',
			renderer: nagiosStatusRender,
			flex: 2
		},
		{
			text: 'Last Check',
			dataIndex: 'last_check',
			// renderer: nagiosDateRender,
			flex: 1
		},
		{
			text: 'Last Hard State Change',
			dataIndex: 'last_hard_state_change',
			// renderer: nagiosDateRender,
			flex: 1
		},
		{
			text: 'Next Check',
			dataIndex: 'next_check',
			// renderer: nagiosDateRender,
			flex: 1
		},
		{
			text: 'Nagios Server',
			dataIndex: 'peer_name',
			flex: 1
		},
		{
			text: 'Notes',
			dataIndex: 'notes',
			// renderer: nagiosDateRender,
			flex: 1
		},
		{
			text: 'Comments',
			dataIndex: 'comments_with_info',
			renderer: function(v){
				if( Ext.isIterable(v) )
				{
					var o=[];
					Ext.each(v,function(i){
						o.push(i[2] + ' - <i>' + i[1] + '</i>');
					});
					return o.join(', ');
				}
			},
			hidden: true,
			flex: 1
		}
		
		
	],
	constructor: function(config) {
		if(!config.contextmenu){
			config.contextMenu=NodeContextMenu;
		}

// did this as listeners were not being added in 4.1beta
		Ext.applyIf(config.listeners,this.listeners);
		if(config.defaultVisibleColumns)
		{
			this.defaultVisibleColumns=config.defaultVisibleColumns;			
		}
		Ext.each(this.columns,function(i){
			if(this.defaultVisibleColumns.indexOf(i.dataIndex)>=0)
			{
				i.hidden=false;
			}
			else
			{
				i.hidden=true;
			}
		},this);
		if(!config.store)
		{
			config.store=new Ext.data.NagiosStore({
				root: {
					loaded:true,
					expanded:true
				}
			});		 
		}
        this.callParent([config]);
    },
	getState: function(i){
		var state={};
		if(this.statefulNodes)
		{
			state.nodes=this.getNodes();			
		}
		state.collapsed=this.collapsed;
		state.customHostFilters=this.store.customHostFilters;
		state.customServiceFilters=this.store.customServiceFilters;
		return state;
	},
	getNodes:function(){
		var nodes=[];
		Ext.each(this.getRootNode().childNodes,function(i)
		{
			var node_state={
				text: i.data.text				
			};
			Ext.each(['nagios_type','meta','name','host_name','iconCls','description'],function(a){
				if(i.data[a])
				{
					node_state[a]=i.data[a];
				}
			});			
			if(i.data.parms)
			{
				node_state.parms= {
					nodetext:i.data.parms.nodetext,
					status: i.data.parms.status,
					query: i.data.parms.query
				};
			}
			nodes.push(node_state);
		});
		return nodes;
	},
	restoreNodes: function(nodes){
		if(nodes.length > 0)
		{
			this.getRootNode().appendChild(nodes);
			// Ext.each(this.getRootNode().childNodes,function(n){
			// 	this.store.refreshNode(n,this.view);
			// },this);
			Ext.Function.defer(this.refresh,500,this);			
		}
	},
	applyState: function(state){
		if(this.stateful)
		{
			this.suspendEvents();
			this.collapsed=state.collapsed;
			if(this.statefulNodes)
			{
				this.restoreNodes(state.nodes);				
			}
			if(state.customHostFilters)
			{
				this.store.customHostFilters=state.customHostFilters;
			}
			if(state.customServiceFilters)
			{
				this.store.customServiceFilters=state.customServiceFilters;
			}
			this.resumeEvents();
		}
	},
	refresh: function(){
		if(this.getRootNode().data.parms)
		{
			this.store.refreshNode(this.getRootNode(),this.view);
		}
		else
		{
			this.getRootNode().eachChild(function(n){
				this.store.refreshNode(n,this.view);
			},this);
		}
	}
});

function nagiosHostNameRender(value, o, node, row, col, store){
	return '<span class=pp-nagiostext-' + node.data.state + ' data-qtip="' + value + '<br/><i>monitored by ' + node.data.peer_name + '</i>">' + value + '</span>';
}


function nagiosStatusRender(value, o, node, row, col, store){
	var r=node.data;
	if( r.last_check < 10 && r.last_check !=''  && r.last_check !=null)
	{
		return 'Pending...';
	}
	if(r.nagios_type == 'meta' &&  r.status.length==0 )
	{
		return 'Total: ' + node.childNodes.length;
	}
	if(r.nagios_type == 'service')
	{
		value=r.plugin_output;
	}
	var rtn='';
	if((typeof r.acknowledged=='string' && r.acknowledged=='1') || (typeof r.acknowledged=='number' && r.acknowledged > 0))
	{
		rtn+='<img unselectable="on" class="x-tree-status x-tree-ack" src="/extjs/resources/images/default/s.gif" data-qtip="acknowledged">';
	}
	if(r.comments_with_info && r.comments_with_info.length>0)
	{
		rtn+='<img unselectable="on" class="x-tree-status x-tree-comment" src="/extjs/resources/images/default/s.gif" data-qtitle="Comments" data-qtip="';
		for(var i = 0, len = r.comments_with_info.length; i < len; i++){
			rtn+=r.comments_with_info[i][2] + ' - <span class=signature><i>' + r.comments_with_info[i][1] +'</i></span><br/>';
        }
		rtn+='">';
	}
	if(r.notifications_enabled===0)
	{
		rtn+='<img unselectable="on" class="x-tree-status x-tree-ndisabled" src="/extjs/resources/images/default/s.gif" data-qtip="notifications disabled">';
	}
	if(typeof r.notification_period != 'undefined' )
	{
		rtn+='<img unselectable="on" class="' + r.notification_period +  '" src="/extjs/resources/images/default/s.gif" data-qtitle="notification period" data-qtip="' + r.notification_period + ' ">';
	}
	//NagUI.log(r);
	if((typeof r.scheduled_downtime_depth!='undefined' && r.scheduled_downtime_depth > 0) ||
		(typeof r.host_scheduled_downtime_depth!='undefined' && r.host_scheduled_downtime_depth > 0))
	{
		rtn+='<img unselectable="on" class="x-tree-status x-tree-schedule" src="/extjs/resources/images/default/s.gif" data-qtitle="Downtime" data-qtip="';	
		for(var i = 0, len = r.downtimes_with_info.length; i < len; i++){
			rtn+=r.downtimes_with_info[i][2] + ' - <span class=signature><i>' + r.downtimes_with_info[i][1] +'</i></span><br/>';
        }
		rtn+='">';
	}
	
	if( r.num_services_crit !== ''
	&&  r.num_services_ok !== ''
	&&  r.num_services_unknown !== ''
	&&  r.num_services_warn !== ''
	)
	{
		if( r.num_hosts != '' )
		{
			rtn+='Hosts: ' + r.num_hosts + ' Svc: ';
		}
		rtn+='<span class=statusOK>OK: '+ r.num_services_ok + '</span>' ;
		rtn+=r.num_services_warn > 0 ? ' <span class=statusWarning>Warn: '+ r.num_services_warn + '</span>' : ' Warn: '+ r.num_services_warn + '';
		rtn+=r.num_services_crit > 0 ? ' <span class=statusCritical>Crit: '+ r.num_services_crit + '</span>' : ' Crit: '+ r.num_services_crit + '';
		rtn+=r.num_services_unknown > 0 ? ' <span class=statusUnknown>Unknown: '+ r.num_services_unknown + '</span>' : ' Unknown: '+ r.num_services_unknown + '';
		return rtn;
	}
	if(typeof r['state = 0'] != 'undefined'
	&& typeof r['state = 1'] != 'undefined'
	&& typeof r['state = 2'] != 'undefined'
	&& typeof r['state = 3'] != 'undefined'
	)
	{
		rtn+='<span class=statusOK>OK: '+ r['state = 0'] + '</span>' ;
		rtn+=r['state = 1'] > 0 ? ' <span class=statusWarning>Warn: '+ r['state = 1'] + '</span>' : ' Warn: '+ r['state = 1'] + '';
		rtn+=r['state = 2'] > 0 ? ' <span class=statusCritical>Crit: '+ r['state = 2'] + '</span>' : ' Crit: '+ r['state = 2'] + '';
		rtn+=r['state = 3'] > 0 ? ' <span class=statusUnknown>Unknown: '+ r['state = 3'] + '</span>' : ' Unknown: '+ r['state = 3'] + '';
		return rtn;
	}
	if(typeof r.state != 'undefined')
	{
		rtn+='<span class=pp-nagios-' + r.state + '>' + value + '</span>';
		return rtn;
	}

	return rtn+value;
}
function nagiosDateRender(value)
{
	if(value)
	{
		value=value*1000;
		if(value < 500000)
		{
			return '';
		}
		var dt=new Date(value);
		return dt.format('Y-m-d H:i:s');
	}
	else
	{
		return '';
	}
}
