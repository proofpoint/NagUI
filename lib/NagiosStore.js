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

NagUI.customNodes=[];

// Queries for nodes are stuck here to be referenced by state restoral
NagUI.nodeQueries.unhandledhostproblems='GET hosts|Columns: notes notes_url address groups next_check scheduled_downtime_depth downtimes_with_info notifications_enabled comments_with_info acknowledged last_check last_hard_state_change plugin_output name state|Filter: scheduled_downtime_depth = 0|Filter: state_type = 1|Filter: state > 0|Filter: acknowledged = 0|Filter: notifications_enabled = 1|Filter: notification_period = 24x7|Filter: notification_period = 24x7_sans_holidays|Filter: notification_period = no_weekend|Or: 3';
NagUI.nodeQueries.unhandledsvcproblems='GET services|Columns: host_notes notes notes_url host_address host_groups next_check scheduled_downtime_depth downtimes_with_info notifications_enabled comments_with_info acknowledged last_check last_hard_state_change plugin_output host_name description groups state|Filter: scheduled_downtime_depth = 0|Filter: state_type = 1|Filter: state > 0|Filter: state < 3|Filter: host_acknowledged = 0|Filter: acknowledged = 0|Filter: notifications_enabled = 1|Filter: notification_period = 24x7|Filter: notification_period = 24x7_sans_holidays|Filter: notification_period = no_weekend|Or: 3';
NagUI.nodeQueries.unhandledproblems='GET services|Columns: host_notes notes notes_url host_address host_groups next_check scheduled_downtime_depth downtimes_with_info notifications_enabled comments_with_info acknowledged last_check last_hard_state_change plugin_output host_name description groups state|Filter: scheduled_downtime_depth = 0|Filter: state_type = 1|Filter: state > 0|Filter: state < 3|Filter: host_acknowledged = 0|Filter: acknowledged = 0|Filter: notifications_enabled = 1|Filter: notification_period = 24x7|Filter: notification_period = 24x7_sans_holidays|Filter: notification_period = no_weekend|Or: 3';
NagUI.nodeQueries.ackedproblems='GET services|Columns: host_notes notes notes_url host_address host_groups next_check downtimes_with_info notifications_enabled comments_with_info acknowledged last_check last_hard_state_change plugin_output host_name description groups state|Filter: acknowledged = 1';
NagUI.nodeQueries.services='GET services|Stats: state = 0|Stats: state = 1|Stats: state = 2|Stats: state = 3|StatsGroupBy: description';
NagUI.nodeQueries.servicegroups='GET servicegroups|Columns: name num_services_ok num_services_warn num_services_crit num_services_unknown';
NagUI.nodeQueries.hostgroups='GET hostgroups|Columns: name num_hosts num_services_ok num_services_warn num_services_crit num_services_unknown|Filter: num_hosts > 0';


Ext.define('nagios_node',{
	extend: 'Ext.data.Model',
	fields: [
		'acknowledged',	'address','check_command','comments_with_info','description','downtimes_with_info',
		'groups','host_address','host_groups','host_name','host_notes','host_scheduled_downtime_depth',
		{name:'last_check', type: 'date',dateFormat:'timestamp'} ,
		{name: 'last_hard_state_change', type: 'date',dateFormat:'timestamp'} ,
		'meta','peer_name','name',
		{name: 'next_check', type: 'date',dateFormat:'timestamp'}, 
		'notes','notes_url','notifications_enabled','notification_period','num_hosts',	'num_services_crit',
		'num_services_ok','num_services_unknown','num_services_warn','plugin_output',
		'query','scheduled_downtime_depth','state',	'status','text','parms',
		{name: 'loaded', convert: function(){return false;} },
		{name: 'checked', convert: function(v){
			if(v==0)
			{
				return false;
			}
			if(v==1)
			{
				return true;
			}
		}},
		// nagios_type determined based on fields returned. needs to be last since fields are processed in order
		{name: 'nagios_type', convert: function(v,node){
			if(v.length)
			{
				return v;
			}
			var nt;
			if(node.data.host_name.length || node.data.description.length)
			{
				nt= 'service';
			}
			if(node.data.num_hosts)
			{
				nt= 'hostgroup';
			}
			if(node.data.num_services_ok && !node.data.num_hosts && !node.data.address)
			{
				nt= 'servicegroup';				
			}
			if(node.data.meta > 0)
			{
				nt= 'meta';
			}
			if(!nt)
			{			
				nt= 'host';
			}			
			// console.log(node);
			// if(nt != 'meta')
			// {
			// 	node.set('iconCls',nt);				
			// }
			return nt;
		}},
		{
			name: 'leaf', convert: function(v,node){
				return (node.get('nagios_type') == 'service' && node.data.num_services_ok == "") ? true : false;
			}
		}
		,
		{
			name: 'iconCls',convert: function(v,node){
				if (node.get('nagios_type') == 'meta' || node.get('meta') == 1)
				{
					return v;	
				}
				return node.get('nagios_type');
			}
		}
	]
});



Ext.define('NagUI.NagiosStore',{
	extend: 'Ext.data.TreeStore',
    alias: 'store.nagios',
    // requires: ['Ext.data.Tree', 'Ext.data.NodeInterface', 'Ext.data.NodeStore'],
    requires: [ 'Ext.data.NodeInterface', 'Ext.data.NodeStore'],
	constructor: function(config) {
		if(!config.model)
		{
			config.model= 'nagios_node';
		}
		if(!config.proxy)
		{
			config.proxy= {
				type: 'ajax',
				url: NagUI.url
			};			
		}
		if(!config.sorters)
		{
			config.sorters=[
				{
					property: 'text',
					direction: 'ASC'
				}
			]	
		}
		if(!config.customHostFilters)
		{
			config.customHostFilters=[];
		}
		if(!config.customServiceFilters)
		{
			config.customServiceFilters=[];
		}
		
		NagUI.NagiosStore.superclass.constructor.apply(this, arguments);     
	},
	initComponent: function(){
		
	},
	onBeforeNodeExpand: function(node, callback, scope,args) {
		var me = this,
            reader, dataRoot, data,
            callbackArgs;
        
        // Children are loaded go ahead with expand
        if (node.isLoaded()) {
            callbackArgs = [node.childNodes];
            if (args) {
                callbackArgs.push.apply(callbackArgs, args);
            }
            Ext.callback(callback, scope || node, callbackArgs);
        }
        // There are unloaded child nodes in the raw data because of the lazy configuration, load them then call back.
        else if (dataRoot = (data = (node.raw || node[node.persistenceProperty])[(reader = me.getProxy().getReader()).root])) {
            me.fillNode(node, reader.extractData(dataRoot));
            delete data[reader.root];
            callbackArgs = [node.childNodes];
            if (args) {
                callbackArgs.push.apply(callbackArgs, args);
            }
            Ext.callback(callback, scope || node, callbackArgs);
        }
        // The node is loading
        else if (node.isLoading()) {
            me.on('load', function() {
                callbackArgs = [node.childNodes];
                if (args) {
                    callbackArgs.push.apply(callbackArgs, args);
                }
                Ext.callback(callback, scope || node, callbackArgs);
            }, me, {single: true});
        }
        // Node needs loading
        else {
            me.read({
                node: node,
				params: this.makeNodeQuery(node),
                callback: function() {
                    // Clear the callback, since if we're introducing a custom one,
                    // it may be re-used on reload
                    delete me.lastOptions.callback;
                    callbackArgs = [node.childNodes];
                    if (args) {
                        callbackArgs.push.apply(callbackArgs, args);
                    }
                    Ext.callback(callback, scope || node, callbackArgs);
                }
            });
        }
    },
	makeNodeQuery: function (node){
		var parms={
			mode: 'treeloader',
			nodetext:'name',
			groupby: 'name'
		};
		if(node.data.parms)
		{
			parms={};
			Ext.apply(parms,node.data.parms);
			if(parms.query)
			{
				parms.query=NagUI.nodeQueries[parms.query] || parms.query;
				if(parms.query.match('GET services'))
				{
					parms.query+= (this.customServiceFilters.length ? '|' + this.customServiceFilters.join('|') : '')
					parms.return_type='services';
					parms.groupby='';
				}
				if(parms.query.match('GET hosts'))
				{
					parms.query+= (this.customHostFilters.length ? '|' + this.customHostFilters.join('|') : '')			
					parms.return_type='hosts';
					parms.groupby='name';
				}
			}
			parms.mode='treeloader';
			return parms;
		}
		if(node.data.query)
		{
			parms.query=NagUI.nodeQueries[node.data.query] || node.data.query;
			if(parms.query.match('GET servicegroups'))
			{
				parms.query+= (this.customServiceGroupFilters.length ? '|' + this.customServiceGroupFilters.join('|') : '')
				parms.return_type='hostsvc';
				parms.groupby='';
			}
			if(parms.query.match('GET services'))
			{
				parms.query+= (this.customServiceFilters.length ? '|' + this.customServiceFilters.join('|') : '')
				parms.return_type='services';
				parms.groupby='';
			}
			if(parms.query.match('GET hosts'))
			{
				parms.query+= (this.customHostFilters.length ? '|' + this.customHostFilters.join('|') : '')			
				parms.return_type='hosts';
				parms.groupby='name';
			}
			return parms;
		}
		// setup query request options
		if(typeof node.data.peer_name !='undefined' 
			&& node.data.peer_name.split(' ').length == 1 
			&& node.data.peer_name.length > 3
			&& node.data.nagios_type != 'meta'
			&& node.data.nagios_type != 'servicegroup' 
			&& node.data.nagios_type != 'hostgroup' )
		{
			parms.peer_name=node.data.peer_name;
		}
		// based on current node what should query params be for child nodes being queried
		if(typeof node.return_type=='undefined')
		{
			parms.return_type='hosts';
			switch(node.data.nagios_type)
			{
				case 'meta':
					parms.return_type='hostgroups';
					parms.groupby='name';
					break;
				case 'metaservice':
					parms.return_type='servicegroups';
					parms.groupby='name';
					break;
				case 'hostgroup':
					parms.return_type='hosts';
					parms.groupby='name';
					break;
				case 'host':
					parms.return_type='services';
					parms.groupby='';
					break;
				case 'service':
					parms.return_type='services';
					parms.groupby='';
					parms.nodetext='hostsvc';
					break;
				case 'servicegroup':
					parms.return_type='services';
					parms.groupby='';
					parms.nodetext='hostsvc';
					break;
			}
		}
		
		// build the livestatus query
		var q='GET ';
		q+=parms.return_type;
		switch(parms.return_type)
		{
			case 'hostgroups' : 
				parms.nodetext='name';
				parms.groupby='name';
				break;			
			case 'servicegroups' : 
				parms.nodetext='name';
				parms.groupby='name';
				break;			
			case 'hosts' : 
				parms.nodetext=parms.nodetext ? parms.nodetext : 'name';
				break;
			case 'services' :	
				parms.nodetext='description';
				parms.groupby='';
				break;
		}
		// check to see if a meta query for services, or a service (group node/servicegroup) that will get all services of same kind
		if(parms.return_type=='services' && (node.data.nagios_type=='meta' || node.data.nagios_type=='servicegroup' || node.data.name == '') )
		{
			parms.nodetext='hostsvc';
			// this.baseAttrs.leaf=true;
		}

		if(typeof this.columns!='undefined')
		{
			q+="|Columns:";
			Ext.each(this.columns,function(i){
				q+=" " + i;
			});
		}
		else
		{
			if(typeof this.query=='undefined')	
			{		
				q+='|Columns: ' + getColumnsForNagiosType(parms.return_type);
			}			
		}
		if(typeof this.query!='undefined')
		{
			if(typeof this.query=='string')
			{
				q+=this.query;
			}
			else
			{
				Ext.each(this.query,function(i){
					q+="|Filter: " + i.field;
					q+=typeof i.operator != 'undefined' ? ' ' + i.operator + ' ' : ' = ';
					q+=i.value;
				});
			}
		}
		else
		{
			switch(node.data.nagios_type)
			{
				// meta should never be used without a query 
				case 'meta' : 
					q+='|Filter: groups = ' + node.data.name;
					break;
				case 'hostgroup' : 
					q+='|Filter: groups >= ' + node.data.name;
					break;
				case 'servicegroup' : 
					q+='|Filter: groups >= ' + node.data.name;
					break;
				case 'host' :	
					q+='|Filter: host_name = ' + node.data.name;
					break;
				case 'service' :
					q+='|Filter: description = ' + node.data.description;
					break;
			}
		}
		parms.query=q;
		if(parms.query.match('GET services'))
		{
			parms.query+= (this.customServiceFilters.length ? '|' + this.customServiceFilters.join('|') : '')
		}
		if(parms.query.match('GET hosts'))
		{
			parms.query+= (this.customHostFilters.length ? '|' + this.customHostFilters.join('|') : '')			
		}

		return parms;
	},
	// recheckNow:function(node,view){
	// 	if(node.nagios_type!='service')
	// 	{
	// 		return;
	// 	}
	// 	var url = NagUI.getNagcheckUrl( node ) + node.data.name + '/' + node.data.description;
	// 	if(Ext.get(view.getNode(node)))
	// 	{
	// 		Ext.get(view.getNode(node)).addCls(view.loadingCls);		
	// 	}
	// 	Ext.Ajax.request({
	// 		url: url,
	// 		method:'GET',
	// 		params:parms,
	// 		node:node,
	// 		success:function(r,o){
	// 			var json = r.responseText;
	// 			var ob=[{}];
	// 			if(json.length>0)
	// 			{
	// 	            ob = eval("("+json+")");
	// 			}
	// 			else
	// 			{
	// 				ob=[{status: 0 }]
	// 			}
	// 			o.node.beginEdit();
	// 			var depth=o.node.data.depth;
	// 			Ext.apply(o.node.data,Ext.ModelMgr.create(ob[0],'nagios_node').data);
	// 			o.node.data.depth=depth;
	// 			if(expand)
	// 			{
	// 				o.node.expand();
	// 			}
	// 			o.node.endEdit();
	// 			// o.node.store.fireEvent('update', o.node.store, o.node, Ext.data.Model.EDIT);
	// 
	// 		}
	// 	});
	// 	
	// 	
	// },
	refreshNode:function(node,view){
		var expand=false;
		node.data.loaded=false;
		if(node.isExpanded())
		{
			node.collapse();
			expand=true;
		}
		node.removeAll();
		// Set loading spinner on node
		if(Ext.get(view.getNode(node)))
		{
			Ext.get(view.getNode(node)).addCls(view.loadingCls);		
		}
		if(expand && node.data.meta==1)
		{
			node.expand();
		}

		if(node.data.meta==1)
		{
			// if not to be expanded, do the load to be able to update the node text
			if(!expand && Ext.get(view.getNode(node)))
			{
				this.read({
					node:node,
					params:this.makeNodeQuery(node),
					callback: function(){
						view.refreshNode(view.indexOf(node));
						Ext.get(view.getNode(node)).removeCls(view.loadingCls);			
					}
				});
			}
			return;
		}
		// this.ui.beforeLoad();
		var parms={
			mode:'treeloader'
		};
		if(typeof node.data.nodeQuery != 'undefined')
		{
			parms=node.data.nodeQuery;
		}
		else
		{

			switch(node.data.nagios_type)
			{
				case 'hostgroup' :
					parms.query='GET hostgroups|Filter: name = ' + node.data.text + '|Columns: ' + getColumnsForNagiosType('hostgroup');
					parms.status='services';
					parms.groupby='name';
					parms.nodetext='name';
					break;
				case 'host' : 
					parms.query='GET hosts|Filter: name = ' + node.data.text + '|Columns: ' + getColumnsForNagiosType('host');
					parms.status='services';
					parms.groupby='name';
					parms.nodetext='name';
					break;
				case 'service' :	
					parms.query='GET services|Filter: host_name = ' + node.data.host_name + '|Filter: description = ' + node.data.description + '|Columns: ' + getColumnsForNagiosType('service');
					parms.leaf=true;
					parms.groupby='name';
					parms.status='plugin_output';
					parms.nodetext=(node.data.text==(node.data.host_name + ' ' + node.data.description) ? 'hostsvc':'description');
					break;
			}
			if(typeof node.status != 'undefined')
			{
				parms.status=node.status;
			}
		}
		node.data.status='';
		Ext.Ajax.request({
			url: NagUI.url,
			method:'GET',
			params:parms,
			node:node,
			success:function(r,o){
				var json = r.responseText;
				var ob=[{}];
				if(json.length>0)
				{
		            ob = eval("("+json+")");
				}
				else
				{
					ob=[{status: 0 }]
				}
				o.node.beginEdit();
				var depth=o.node.data.depth;
				Ext.apply(o.node.data,Ext.ModelMgr.create(ob[0],'nagios_node').data);
				o.node.data.depth=depth;
				if(expand)
				{
					o.node.expand();
				}
				o.node.endEdit();
				Ext.get(view.getNode(node)).removeCls(view.loadingCls);			
				// o.node.store.fireEvent('update', o.node.store, o.node, Ext.data.Model.EDIT);

			}
		});
	}	
});

