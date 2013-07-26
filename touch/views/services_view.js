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

nagios.views.servicelist=Ext.extend(Ext.List,{
	cls: 'x-list-marginitems',
	autoHeight: true,
	plugins:[{
		ptype: 'pullrefresh',
		refreshFn:function(rtnFn,pl){
			var s=pl.list.store;
			s.load({params:s.queryParams, callback: rtnFn, scope: pl});			
		}
	}],
	itemTpl: new Ext.XTemplate(
		'<div class="servicelist-item  x-list-margin-item nagiosgradient-{state}">',
		'<tpl if="state &gt; 0">',
			'<div style="float:right;">',
			'{[ this.addCmp({xtype:"button",ui:"confirm", text:"Ack",handler: function(){ Ext.ControllerManager.get("overview").ackWindow(values); } })   ]}',
			'</div>',
		'</tpl>',
		'<div>',
			'{label}',
			'<div class="service-output">',
			'<img src="/extjs/resources/images/default/s.gif" class="ack-{acknowledged}" unselectable="on">',
			'<img src="/extjs/resources/images/default/s.gif" class="comment-{[values.comments_with_info.length]}" unselectable="on">',
			'<img src="/extjs/resources/images/default/s.gif" class="ndisabled-{notifications_enabled}" unselectable="on">',
			'<img src="/extjs/resources/images/default/s.gif" class="{notification_period}" unselectable="on">',
			'<img src="/extjs/resources/images/default/s.gif" class="schedule-{scheduled_downtime_depth}" unselectable="on">',
			'{plugin_output}',
			'</div>',
		'</div>',
		'</div>'
		// ,
		// {
		// 	addButton: function(){
		// 		console.log(this);
		// 		//return this.master.addCmp({xtype:"button", text:"Ack",handler: function(){alert(values.label); } }); 
		// 	}
		// }
	),
	store:new Ext.data.Store({
		model: 'Service',
		queryParams:{},
		listeners:{
			beforeload : {
				fn: function(s,options){
					s.queryParams={};
					Ext.apply(s.queryParams,options.params);
					if(!options.params.query.match('GET'))
					{	
						options.params.query='GET services|Columns: notification_period host_address notes_url scheduled_downtime_depth host_scheduled_downtime_depth next_check downtimes_with_info notifications_enabled comments_with_info acknowledged last_check last_hard_state_change plugin_output host_name description host_groups groups state' + options.params.query;
					}
				}
			},
			load : {
				fn: function(s,recs,successful){
					
				}
			} 
		},
		sorters: [
			{
				property: 'state',
				direction: 'DESC'
			},
			{
				property: 'label',
				direction: 'ASC'
			}
		]
	}),
//	onItemDisclosure: function() {},
	initComponent: function(){
		nagios.views.servicelist.superclass.initComponent.apply(this,arguments);
		this.enableBubble('selectionchange');
		this.enableBubble('itemtap');
		this.enableBubble('itemdoubletap');
		this.enableBubble('ack');
	}
});

Ext.reg('servicelist',nagios.views.servicelist);



nagios.views.serviceview=Ext.extend(Ext.Panel, {
	layout: 'fit',
	fullscreen: true,
	items: 	{xtype: 'servicelist'},
	initComponent: function(){
		nagios.views.serviceview.superclass.initComponent.apply(this,arguments);
		this.addDocked({
			dock: 'top',
			xtype: 'toolbar',
			items: [
				{
					text: 'Back',
					xtype: 'button',
					ui: 'back',
					handler: this.backBtn,
					scope: this
				},
				{
					xtype:'spacer'
				},
				{
					text: '',
					scope:this,
					iconCls:'refresh',
					iconMask:true,
					handler: function(){
						this.items.items[0].loadMask.enable();
						var s=this.items.items[0].store;
						s.load({params:s.queryParams});
					}
				},
				{
					xtype:'spacer'
				}
			],
			cls: 'x-toolbar-dark',
			baseCls: 'x-toolbar',
			layout: {
				type: 'hbox',
				align: 'center'
			}			
		});
	},
	backBtn: function(){
		if(Ext.getCmp('mainapp').getActiveItem().dockedItems.items[0].items.items[2].getText() == 'Svc Problems')
		{
			this.ownerCt.layout.setActiveItem(0,{type: 'slide', direction: 'right'});			
		}
		else
		{
			this.ownerCt.layout.prev({type: 'slide', direction: 'right'});			
		}
	}
});
Ext.reg('serviceview',nagios.views.serviceview);

nagios.views.servicepopup=Ext.extend(Ext.Panel, {
	floating: true,
	modal: true,
	centered: true,
	width: (Ext.is.iPad ? 600 : 310),
	height: (Ext.is.iPad ? 700 : 380),
	styleHtmlContent: true,
	scroll: 'vertical',
	dockedItems: [
		{
			dock: 'top',
			xtype: 'toolbar',
			title: 'Info',
			items:[
				{
					xtype:'spacer'
				},
				{
					text:'Done',
					ui: 'action',
					handler: function(){
						this.ownerCt.ownerCt.hide();
					}
				}
			]
		}
		,
		{
			dock: 'top',
			xtype: 'toolbar',
			items: [
				{
					text:'Schedule Downtime',
					handler: function(){
						this.ownerCt.ownerCt.hide();
						Ext.ControllerManager.get("overview").scheduleDowntime(this.ownerCt.ownerCt.node);
					}
				},
				{
					text:' Disable Alerts',
					// text:(node.data.notifications_enabled ? 'Disable Alerts': 'Enable Alerts'),
					handler: function(){
						this.ownerCt.ownerCt.hide();
						Ext.ControllerManager.get("overview").toggleAlerts(this.ownerCt.ownerCt.node);
					}
				}
			]
		}
	]
});
Ext.reg('servicepopup',nagios.views.servicepopup);
