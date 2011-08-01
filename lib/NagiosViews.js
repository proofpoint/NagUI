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

Ext.define('Ext.tab.NagiosViews',{
	extend:'Ext.tab.Panel',
	alias: 'widget.nagiosviews',
	activeTab:0,
	stateEvents: ['add','remove'],
	listeners:{
		'add':function(tabbar,newtab,indx){
			// Ext.state.Manager.set('nagios_views',this.getState());
			newtab.on('render',function(tab){
				if(tab.xtype=='tab')
				{
					new Ext.dd.DropZone(tab.getEl(),{
						ddGroup: 'nagiosDD',
						getTargetFromEvent: function(e){
							return tab.getEl(); 
						}, 
						onNodeOver : function(target, dd, e, data){ 
							// console.log(arguments);
							data.copy=true;
				            return Ext.dd.DropZone.prototype.dropAllowed;
				        },
				        onNodeDrop : function(nodeData, source, e, data){
							data.copy=true;
							var newdata=Ext.clone(data);
							Ext.each(newdata.records,function(r){
								r.parentNode=undefined;
							});
							var node=tab.card.store.getRootNode().appendChild(newdata.records);
							if(node)
							{
								node.data.allowDrop=false;
							}
							return true;
				        },			
					});
				}
			});
		},
		remove:function(t,p){
			Ext.state.Manager.clear(p.id);			
			// Ext.state.Manager.set('nagios_views',this.getState());
		}		
	},
	getState:function(){
		var views=[];
		this.items.each(function(i){
			if(i.title=='Search')
			{
				return;
			}
			views.push(i.title);
		});
		var state={
			customviews: views
		}
		return state;
	},
	applyState:function(state){
		this.on('afterrender',function(){
			if(state.customviews)
			{
				for(var i=0;i<state.customviews.length;i++)
				{
					var newview=addCustomView(state.customviews[i]);
				}
			}							
		},this,{single:true});
	},
	dockedItems:[
	{
		dock: 'top',
		xtype: 'toolbar',
		items:[
			new Ext.button.Split({
				text: 'Refresh',
				id: 'views_refresh',
				handler:function()
				{
					var tree=this.up('nagiostree') || Ext.getCmp('nagios_views').getActiveTab();
					tree.refresh();
				},
				iconCls: 'x-tbar-loading',
				menu: {
					listeners: {
						beforeshow: function(menu){
							var time=Ext.getCmp('nagios_views').getActiveTab().autoRefresh;		
							menu.items.each(function(k){
								if(typeof k.setChecked == 'undefined')
								{
									return;
								}
								if(k.time == time)
								{
									k.setChecked(true);
								}
								else
								{
									k.setChecked(false);
								}
							});			

						}
					},
					items:[
						{text: '<i>auto refresh at:</i>'},
						{checked:false,text: '30 seconds',time:'30',handler:function(i){toggleAutoRefresh(i,Ext.getCmp('nagios_views').getActiveTab())},hideOnClick:true},
						{checked:false,text: '1 min',time: '60',handler:function(i){toggleAutoRefresh(i,Ext.getCmp('nagios_views').getActiveTab())},hideOnClick:true},
						{checked:false,text: '5 min',time: '300',handler:function(i){toggleAutoRefresh(i,Ext.getCmp('nagios_views').getActiveTab())},hideOnClick:true}
					]
				}
			}),
			{
				text:'Actions',
				menu:{
					items:[
						{
							text: 'New Custom View',
							handler: addCustomView,
							menu:{
								items:[
									{
										text: 'from Search Results',
										handler: function(){
											var newviewroot=addCustomView().store.getRootNode();
											Ext.each(Ext.getCmp('nagios_search').store.getRootNode().childNodes,function(i){
												i.collapse();
											});
											Ext.each(Ext.getCmp('nagios_search').store.getRootNode().childNodes,function(i){
												var a=i.copy();
												a.expanded=false;
												newviewroot.appendChild(a);
												return;
											});
										}
									},
									{
										text: 'from Checked Items',
										handler: function(){
											var nodes=Ext.getCmp('nagios_views').getActiveTab().getChecked();
											var newviewroot=addCustomView().store.getRootNode();
											Ext.each(nodes,function(i){
												var a=i.copy();
												a.expanded=false;
												newviewroot.appendChild(a);
												return;
											});
										}
									}
								
								]
							}
						},
						{
							text: 'Rename current View',
							handler: function(){
								var views=Ext.getCmp('nagios_views');
								if(views.getActiveTab().title=='Search')
								{
									Ext.Msg.alert("Error",'The search view cannot be renamed');
									return;
								}
								Ext.Msg.prompt('Rename','Enter new name for the custom view:',function(btn,txt){
									if(btn=='ok'){
										Ext.state.Manager.clear(views.getActiveTab().stateId)
										views.getActiveTab().setTitle(txt);	
										views.getActiveTab().stateId=txt.replace(' ','-');
										Ext.state.Manager.set(views.getStateId(),views.getState());
										Ext.state.Manager.set(views.getActiveTab().getStateId(),views.getActiveTab().getState());
									}
								});
							}
						},
						{
							text: '<span style="font-style:italic;font-size:7pt;">Bulk actions below<br>apply to all checked items</span>'
						},
						{	
							iconCls:'x-tree-refresh',
							text: 'Re-Check',
							handler: function(){
								var nodes=Ext.getCmp('nagios_views').getActiveTab().getChecked();
								if(nodes.length>0)
								{
									scheduleRecheck(nodes);
								}
							}
						},
						{	
							iconCls:'x-tree-ack',
							text: 'Acknowledge',
							handler:function(b,e){
								var nodes=Ext.getCmp('nagios_views').getActiveTab().getChecked();
								if(nodes.length>0)
								{
									ackWindow(nodes);
								}
							}
						},
						{	
							id:'batch_enablealerts',
							iconCls:'x-tree-notify',
							text: 'Enable Alerts',
							handler:function(){
								var nodes=Ext.getCmp('nagios_views').getActiveTab().getChecked();
								if(nodes.length>0)
								{
									toggleAlerts(nodes,'ENABLE');
								}
							}

						},

						{	
							id:'batch_disablealerts',
							iconCls:'x-tree-ndisabled',
							text: 'Disable Alerts',
							handler:function(){
								var nodes=Ext.getCmp('nagios_views').getActiveTab().getChecked();
								if(nodes.length>0)
								{
									toggleAlerts(nodes,'DISABLE');
								}
							}
						},
						{	
							id:'batch_schedule',
							iconCls:'x-tree-schedule',
							text: 'Schedule Downtime',
							handler:function(){
								var nodes=Ext.getCmp('nagios_views').getActiveTab().getChecked();
								if(nodes.length>0)
								{
									scheduleDowntimeWindow(nodes);
								}
							}
						},
						{	
							id:'batch_removedowntime',
							iconCls:'x-tree-schedule',
							text: 'Remove Downtime',
							handler:function(){
								var nodes=Ext.getCmp('nagios_views').getActiveTab().getChecked();
								if(nodes.length>0)
								{
									removeDowntime(nodes);
								}
							}
						},
						{	
							id:'batch-comment',
							iconCls:'x-tree-comment',
							text: 'Add Comment',
							handler:function(){
								var nodes=Ext.getCmp('nagios_views').getActiveTab().getChecked();
								if(nodes.length>0)
								{
									commentWindow(nodes);
								}
							}
						}
					]  //end menu items
				}
			}, // end menu
			{
				xtype:'tbseparator'
			},
			{
				xtype:'tbspacer'
			},
			{
				text: 'Filter',
				menu:{
					listeners:{
						'beforeshow': function(m,e){
							var tab=Ext.getCmp('nagios_views').getActiveTab();
							m.items.each(function(i){
								i.setChecked(Ext.Array.contains(tab.store.customHostFilters,i.HostFilter),true);
							});
						}
					},
					items:[
						{
							text: 'Hide OK hosts/services',
							xtype:'filteritem',
							id: 'nagios_views_hideOK',
							HostFilter: 'Filter: num_services_hard_crit > 0|Filter: num_services_hard_warn > 0|Filter: num_services_hard_unknown > 0|Or: 3',
							ServiceFilter: 'Filter: state > 0'
						},
						{
							text: 'Hide WARNING hosts/services',
							xtype:'filteritem',
							id: 'nagios_views_hideWARNING',
							// HostFilter: 'Filter: num_services_hard_crit > 0|Filter: num_services_hard_warn > 0|Filter: num_services_hard_unknown > 0|Or: 3',
							HostFilter: 'Filter: state !=1',
							ServiceFilter: 'Filter: state != 1'
						},
						{
							text: 'Hide CRITICL hosts/services',
							xtype:'filteritem',
							id: 'nagios_views_hideCRITICAL',
							// HostFilter: 'Filter: num_services_hard_crit > 0|Filter: num_services_hard_warn > 0|Filter: num_services_hard_unknown > 0|Or: 3',
							HostFilter: 'Filter: state !=2',
							ServiceFilter: 'Filter: state != 2'
						},
						{
							text: 'Hide UKNOWN hosts/services',
							xtype:'filteritem',
							id: 'nagios_views_hideUNKNOWN',
							// HostFilter: 'Filter: num_services_hard_crit > 0|Filter: num_services_hard_warn > 0|Filter: num_services_hard_unknown > 0|Or: 3',
							HostFilter: 'Filter: state !=3',
							ServiceFilter: 'Filter: state != 3'
						},
						{
							text: 'Show Production Only',
							xtype:'filteritem',
							id: 'showproductiononly',
							HostFilter: 'Filter: groups >= production-systems',
							ServiceFilter: 'Filter: host_groups >= production-systems'
						},
						{
							text: 'Show Unhandled Only (services)',
							xtype:'filteritem',
							id: 'showunhandledonly',
							HostFilter: 'Filter: groups >= production-systems',
							ServiceFilter: 'Filter: scheduled_downtime_depth = 0|Filter: state_type = 1|Filter: state > 0|Filter: state < 3|Filter: host_acknowledged = 0|Filter: acknowledged = 0|Filter: notifications_enabled = 1|Filter: notification_period = 24x7|Filter: notification_period = 24x7_sans_holidays|Filter: notification_period = no_weekend|Or: 3'
						}

					]
				}
			},
			{
				xtype:'tbfill'
			},
			{
				text: 'Search hosts: ',
				id: 'search_type',
				searchtype: 'host',
				iconCls: 'host',
				menu: {
					itemHandler:function(i)
					{
						var st=Ext.getCmp('search_type');
						st.setText(i.text);
						st.searchtype=(i.id);
						st.setIconCls(i.id);						
					},
					items:[
					{
						id: 'hostgroup',
						text: 'Search hostgroups:',
						iconCls: 'hostgroup',
						handler: function(i) { this.parentMenu.itemHandler(i); }	
					},
					{
						id: 'host',
						text: 'Search hosts:',
						iconCls: 'host',
						handler: function(i) { this.parentMenu.itemHandler(i); }	
					},
					{
						id: 'service',
						text: 'Search services:',
						iconCls: 'service',
						handler: function(i) { this.parentMenu.itemHandler(i); }	
					}
					]
				}
			},
			{
				xtype: 'trigger',
				name: 'search_input',
				id: 'search_input',
				triggerCls: 'x-form-search-trigger',
				onTriggerClick: nagiosSearch,
				listeners: {
				        'specialkey':  function(f,e){
				                if(e.getKey() == e.ENTER)
				                {
				                        this.onTriggerClick();
				                }
				        }
				}
			},
			'-',
			{
				iconCls:'helpicon',
				handler:function(){
					var a=new Ext.Window({
						title:'Help',
						width:600,
						height:400,
						layout:'fit',
						items:[
							{
								xtype:'panel',
								html:Ext.get('help').dom.innerHTML,
								baseCls:'helpwindow'
							}
						]
					});
					a.show();
				}
			}
		]
		}
	]
});